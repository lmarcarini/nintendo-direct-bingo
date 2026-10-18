import { DEFAULT_TITLE, type Card, type View } from "../card/card";
import { DEFAULT_MARKER, isMarker } from "../card/markers";
import { fromPayload } from "../card/payload";
import { DEFAULT_THEME, isTheme } from "../card/themes";
import {
  cleanSquare,
  cleanTitle,
  type ClientMessage,
  type RoomCard,
  type Settings,
  type Target,
} from "./protocol";

// Between the app's Card and the room's card. The client keeps its own copy
// of the room's card (what it last heard from the server, plus what it has
// sent since); a local change is whatever differs from that copy

// A change to the card, as the server sends it (text also says who wrote
// it, which doesn't matter here)
export type Change =
  | { type: "text"; target: Target; text: string }
  | { type: "mark"; i: number; on: boolean }
  | ({ type: "settings" } & Settings)
  | { type: "cleared"; squares: number[] };

const bit = (i: number) => 1 << i;

// The room has "" for the default title; locally that's DEFAULT_TITLE.
// Cards and titles from the server go through this, so both sides compare
// equal
const roomTitle = (title: string) => title || DEFAULT_TITLE;

export const receivedCard = (card: RoomCard): RoomCard => ({
  ...card,
  t: roomTitle(card.t),
});

// Text is cleaned as the server cleans it, so comparing with the room's
// copy only finds real changes. The card model already keeps text within
// the limits, so cleaning never fails in practice
export const toRoomCard = (card: Card): RoomCard => ({
  t: cleanTitle(card.title) ?? "",
  s: card.values.map((text) => cleanSquare(text) ?? ""),
  n: card.nItems,
  th: card.theme,
  m: card.marks,
  mk: card.marker,
  a: card.animations ? 1 : 0,
  dg: card.diagonals ? 1 : 0,
  el: card.everyLine ? 1 : 0,
});

// View mode belongs to each player, so it stays the local one. fromPayload
// maps theme and marker ids this version doesn't know to the defaults
export const fromRoomCard = (card: RoomCard, view: View): Card =>
  fromPayload({ ...card, v: view === "preview" ? "p" : undefined });

const settingsOf = (message: Settings): Settings => {
  const settings: Settings = {};
  if (message.n !== undefined) settings.n = message.n;
  if (message.th !== undefined) settings.th = message.th;
  if (message.mk !== undefined) settings.mk = message.mk;
  if (message.a !== undefined) settings.a = message.a;
  if (message.dg !== undefined) settings.dg = message.dg;
  if (message.el !== undefined) settings.el = message.el;
  return settings;
};

// The room's card after a change the server sent
export const applyToRoom = (card: RoomCard, change: Change): RoomCard => {
  switch (change.type) {
    case "text":
      return change.target === "title"
        ? { ...card, t: roomTitle(change.text) }
        : {
            ...card,
            s: card.s.map((text, i) => (i === change.target ? change.text : text)),
          };
    case "mark":
      return {
        ...card,
        m: change.on ? card.m | bit(change.i) : card.m & ~bit(change.i),
      };
    case "settings":
      return { ...card, ...settingsOf(change) };
    case "cleared":
      return {
        ...card,
        s: card.s.map((text, i) => (change.squares.includes(i) ? "" : text)),
        m: 0,
      };
  }
};

// The same change, as a patch to the local card
export const patchFor = (card: Card, change: Change): Partial<Card> => {
  switch (change.type) {
    case "text":
      return change.target === "title"
        ? { title: roomTitle(change.text) }
        : {
            values: card.values.map((text, i) =>
              i === change.target ? change.text : text
            ),
          };
    case "mark":
      return {
        marks: change.on
          ? card.marks | bit(change.i)
          : card.marks & ~bit(change.i),
      };
    case "settings": {
      const patch: Partial<Card> = {};
      if (change.n !== undefined) patch.nItems = change.n;
      if (change.th !== undefined)
        patch.theme = isTheme(change.th) ? change.th : DEFAULT_THEME;
      if (change.mk !== undefined)
        patch.marker = isMarker(change.mk) ? change.mk : DEFAULT_MARKER;
      if (change.a !== undefined) patch.animations = change.a === 1;
      if (change.dg !== undefined) patch.diagonals = change.dg === 1;
      if (change.el !== undefined) patch.everyLine = change.el === 1;
      return patch;
    }
    case "cleared":
      return {
        values: card.values.map((text, i) =>
          change.squares.includes(i) ? "" : text
        ),
        marks: 0,
      };
  }
};

type Diff = {
  ops: ClientMessage[];
  // Local changes this client isn't allowed to make (text it doesn't hold
  // the lock for), to put back to the room's value
  reverts: Target[];
};

const countMarks = (marks: number) => marks.toString(2).replace(/0/g, "").length;

// What a local change should send. `mine` is the square or title this
// client is editing (it asked for that lock). Clear and Clear marks are
// recognized by their result, so they go as one message each: an emptied
// card with no marks is `clear`, no marks left of several is `clear-marks`
export const diffCard = (
  room: RoomCard,
  local: RoomCard,
  mine: Target | null,
  lockedByOther: (target: Target) => boolean
): Diff => {
  const ops: ClientMessage[] = [];
  const reverts: Target[] = [];

  const text = (target: Target, value: string) => {
    if (target === mine) ops.push({ type: "text", target, text: value });
    else reverts.push(target);
  };

  const cleared =
    local.s.every((value) => !value) &&
    local.m === 0 &&
    room.s.some(Boolean);
  if (cleared) {
    ops.push({ type: "clear" });
    // The server keeps what someone else is typing
    room.s.forEach((value, i) => {
      if (value && lockedByOther(i)) reverts.push(i);
    });
  } else {
    local.s.forEach((value, i) => {
      if (value !== room.s[i]) text(i, value);
    });
    if (local.m !== room.m) {
      if (local.m === 0 && countMarks(room.m) > 1) ops.push({ type: "clear-marks" });
      else
        for (let i = 0; i < room.s.length; i++)
          if ((local.m & bit(i)) !== (room.m & bit(i)))
            ops.push({ type: "mark", i, on: (local.m & bit(i)) !== 0 });
    }
  }
  if (local.t !== room.t) text("title", local.t);

  const settings: Settings = {};
  if (local.n !== room.n) settings.n = local.n;
  // A theme or marker this version doesn't know shows as the default here;
  // that's not a change to send back
  if (local.th !== room.th && (isTheme(room.th) || local.th !== DEFAULT_THEME))
    settings.th = local.th;
  if (local.mk !== room.mk && (isMarker(room.mk) || local.mk !== DEFAULT_MARKER))
    settings.mk = local.mk;
  if (local.a !== room.a) settings.a = local.a;
  if (local.dg !== room.dg) settings.dg = local.dg;
  if (local.el !== room.el) settings.el = local.el;
  if (Object.keys(settings).length) ops.push({ type: "settings", ...settings });

  return { ops, reverts };
};

// The room's card after this client's own ops, as the server will apply
// them (sent text isn't echoed back, so this is the only place it lands)
export const applyOps = (
  room: RoomCard,
  ops: ClientMessage[],
  lockedByOther: (target: Target) => boolean
): RoomCard =>
  ops.reduce((card, op): RoomCard => {
    switch (op.type) {
      case "text":
      case "mark":
      case "settings":
        return applyToRoom(card, op);
      case "clear":
        return applyToRoom(card, {
          type: "cleared",
          squares: card.s.map((_, i) => i).filter((i) => !lockedByOther(i)),
        });
      case "clear-marks":
        return applyToRoom(card, { type: "cleared", squares: [] });
      default:
        return card;
    }
  }, room);

// Puts the room's text back on the given targets of the local card
export const revertPatch = (
  card: Card,
  room: RoomCard,
  targets: Target[]
): Partial<Card> => {
  const patch: Partial<Card> = {};
  const squares = targets.filter((target) => target !== "title");
  if (targets.includes("title")) patch.title = room.t;
  if (squares.length)
    patch.values = card.values.map((text, i) =>
      squares.includes(i) ? room.s[i] : text
    );
  return patch;
};
