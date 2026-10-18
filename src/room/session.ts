import { isMarked, type Card } from "../card/card";
import {
  parseServerMessage,
  PROTOCOL_VERSION,
  type ClientMessage,
  type ErrorCode,
  type LockInfo,
  type PlayerId,
  type PlayerInfo,
  type RoomCard,
  type ServerMessage,
  type Target,
} from "./protocol";
import {
  applyOps,
  applyToRoom,
  diffCard,
  fromRoomCard,
  patchFor,
  receivedCard,
  revertPatch,
  toRoomCard,
} from "./sync";

// One player's connection to a room, loaded with a dynamic import() only
// when someone joins. It never throws into the app: when the server is
// down or drops, the card goes on working locally and this keeps retrying

export type RoomStatus = "idle" | "connecting" | "reconnecting" | "joined";
export type RoomError = "room-full" | "rooms-full" | "invalid" | "outdated";

export type RoomState = {
  status: RoomStatus;
  room: string;
  you: PlayerId | null;
  players: PlayerInfo[];
  locks: LockInfo[];
  error?: RoomError | "unavailable";
};

export type RoomOptions = {
  url: string;
  room: string;
  name: string;
  getCard: () => Card;
  onState: (state: RoomState) => void;
  // Remote changes and reverts, as a patch on the current card
  applyPatch: (patch: (card: Card) => Partial<Card>) => void;
  // Someone else marked a square: `card` is the card with that mark
  onRemoteMark: (card: Card, index: number) => void;
};

export type RoomHandle = {
  cardChanged: (card: Card) => void;
  focus: (target: Target) => void;
  blur: (target: Target) => void;
  leave: () => void;
};

const TEXT_THROTTLE_MS = 150; // well under the server's rate limit
const LOCK_REFRESH_MS = 10_000; // the server lets go after 30s without one
const KEEPALIVE_MS = 4 * 60_000; // Render's free plan sleeps after 15 min idle
const MAX_BACKOFF_MS = 30_000;
const CLOSE_VERSION = 4000;

// Errors in answer to `join` that retrying won't fix
const JOIN_ERRORS: Partial<Record<ErrorCode, RoomError>> = {
  "room-full": "room-full",
  "rooms-full": "rooms-full",
  invalid: "invalid",
};

export const openRoom = (options: RoomOptions): RoomHandle => {
  const { url, room, name } = options;
  let socket: WebSocket | null = null;
  let stopped = false;
  let everJoined = false;
  let attempt = 0;
  let retry: ReturnType<typeof setTimeout> | undefined;
  let keepAlive: ReturnType<typeof setInterval> | undefined;

  // The room's card as far as this client knows; null while not joined
  let roomCard: RoomCard | null = null;
  let you: PlayerId | null = null;
  let players: PlayerInfo[] = [];
  let locks = new Map<Target, PlayerId>();
  // The focused square or title, whose lock this client asked for
  let mine: Target | null = null;
  let lockedAt = 0;
  let pending: { target: Target; text: string } | null = null;
  let textTimer: ReturnType<typeof setTimeout> | undefined;

  const report = (status: RoomStatus, error?: RoomError) =>
    options.onState({
      status,
      room,
      you,
      players,
      locks: [...locks].map(([target, by]) => ({ target, by })),
      error,
    });

  const send = (message: ClientMessage) => {
    if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify(message));
  };

  const lock = (target: Target) => {
    send({ type: "lock", target });
    lockedAt = Date.now();
  };

  const lockedByOther = (target: Target) => {
    const by = locks.get(target);
    return by !== undefined && by !== you;
  };

  // Typing sends the whole text, at most every TEXT_THROTTLE_MS; the last
  // keystroke always goes
  const flushText = () => {
    clearTimeout(textTimer);
    textTimer = undefined;
    const text = pending;
    pending = null;
    if (!text || !roomCard || text.target !== mine) return;
    if (Date.now() - lockedAt > LOCK_REFRESH_MS) lock(text.target);
    send({ type: "text", ...text });
  };

  const queueText = (target: Target, text: string) => {
    if (pending && pending.target !== target) flushText();
    pending = { target, text };
    textTimer ??= setTimeout(flushText, TEXT_THROTTLE_MS);
  };

  const cardChanged = (card: Card) => {
    // Not joined: the card is solo until it (re)joins, when the room's wins
    if (!roomCard || stopped) return;
    const { ops, reverts } = diffCard(roomCard, toRoomCard(card), mine, lockedByOther);
    for (const op of ops) {
      if (op.type === "text") queueText(op.target, op.text);
      else {
        flushText();
        send(op);
      }
    }
    roomCard = applyOps(roomCard, ops, lockedByOther);
    if (reverts.length) {
      const current = roomCard;
      options.applyPatch((card) => revertPatch(card, current, reverts));
    }
  };

  const receive = (message: ServerMessage) => {
    if (message.type === "joined") {
      attempt = 0;
      everJoined = true;
      you = message.you;
      players = message.players;
      locks = new Map(message.locks.map((lock) => [lock.target, lock.by]));
      const joined = (roomCard = receivedCard(message.card));
      options.applyPatch((card) => fromRoomCard(joined, card.view));
      if (mine !== null) lock(mine);
      report("joined");
      return;
    }
    if (message.type === "error") {
      const error = JOIN_ERRORS[message.code];
      if (!roomCard && error) stop(error);
      else console.warn(`Room server: ${message.code}`);
      return;
    }
    if (!roomCard) return;

    switch (message.type) {
      case "player-joined":
        players = [...players, message.player];
        break;
      case "player-left":
        players = players.filter((player) => player.id !== message.id);
        break;
      case "locked":
        locks.set(message.target, message.by);
        // Someone else got there first: this client's edits there are off
        if (message.by !== you && message.target === mine) {
          mine = null;
          pending = null;
        }
        break;
      case "unlocked":
        locks.delete(message.target);
        // Still focused here: ask again before the next text
        if (message.target === mine) lockedAt = 0;
        break;
      case "text":
      case "mark":
      case "settings":
      case "cleared": {
        const before = options.getCard();
        roomCard = applyToRoom(roomCard, message);
        options.applyPatch((card) => patchFor(card, message));
        if (message.type === "mark" && message.on && !isMarked(before.marks, message.i))
          options.onRemoteMark({ ...before, ...patchFor(before, message) }, message.i);
        return;
      }
      case "pong":
        return;
    }
    report("joined");
  };

  const reconnectSoon = () => {
    const delay = Math.min(MAX_BACKOFF_MS, 1000 * 2 ** attempt++);
    retry = setTimeout(connect, delay * (0.5 + Math.random() / 2));
  };

  const connect = () => {
    clearTimeout(retry);
    report(everJoined ? "reconnecting" : "connecting");
    let ws: WebSocket;
    try {
      ws = new WebSocket(url);
    } catch {
      reconnectSoon();
      return;
    }
    socket = ws;

    ws.onopen = () => {
      const join = { v: PROTOCOL_VERSION, room, name, card: toRoomCard(options.getCard()) };
      ws.send(JSON.stringify({ type: "join", ...join }));
      keepAlive = setInterval(() => send({ type: "ping" }), KEEPALIVE_MS);
    };
    ws.onmessage = (event) => {
      if (stopped || socket !== ws || typeof event.data !== "string") return;
      const message = parseServerMessage(event.data);
      if (message) receive(message);
      else console.warn("Room server: ignored an invalid message");
    };
    ws.onclose = (event) => {
      if (socket !== ws) return;
      socket = null;
      clearInterval(keepAlive);
      roomCard = null;
      you = null;
      players = [];
      locks = new Map();
      pending = null;
      if (stopped) return;
      if (event.code === CLOSE_VERSION) return stop("outdated");
      report(everJoined ? "reconnecting" : "connecting");
      reconnectSoon();
    };
  };

  // A phone that comes back from sleep or a network that returns shouldn't
  // wait out the backoff
  const retryNow = () => {
    if (stopped || socket || document.visibilityState !== "visible") return;
    attempt = 0;
    connect();
  };

  const stop = (error?: RoomError) => {
    stopped = true;
    clearTimeout(retry);
    clearTimeout(textTimer);
    clearInterval(keepAlive);
    document.removeEventListener("visibilitychange", retryNow);
    window.removeEventListener("online", retryNow);
    socket?.close(1000);
    socket = null;
    if (error) report("idle", error);
  };

  document.addEventListener("visibilitychange", retryNow);
  window.addEventListener("online", retryNow);
  connect();

  return {
    cardChanged,
    focus(target) {
      if (pending && pending.target !== target) flushText();
      mine = target;
      if (roomCard) lock(target);
    },
    // Deferred, so a change made on blur (an emptied title going back to the
    // default) is still sent as this client's before the lock goes
    blur(target) {
      setTimeout(() => {
        if (mine !== target) return;
        flushText();
        mine = null;
        if (roomCard) send({ type: "unlock", target });
      });
    },
    leave() {
      flushText();
      stop();
    },
  };
};
