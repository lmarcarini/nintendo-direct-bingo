import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Card } from "../card/card";
import type { Target } from "../room/protocol";
import {
  readRoomParam,
  savedPlayerName,
  savePlayerName,
  writeRoomParam,
} from "../room/remembered";
import type { RoomHandle, RoomState } from "../room/session";
import type { UpdateCard } from "./useCard";

const SERVER_URL = import.meta.env.VITE_ROOM_SERVER_URL;

// Without a server URL in the build, the app is solo only
export const roomsAvailable = Boolean(SERVER_URL);

const IDLE: RoomState = { status: "idle", room: "", you: null, players: [], locks: [] };

// How squares and the title learn who else is editing them, and say when
// this player starts and stops. Solo, nothing is ever locked
export type Editing = {
  lockedBy: (target: Target) => string | undefined;
  start: (target: Target) => void;
  end: (target: Target) => void;
};

type Request = { room: string; name: string };

// The room this player is in, if any. The room client (room/session.ts) is
// only loaded on join, and whatever it does, the card keeps working: it
// goes through `update` like any other change
export const useRoom = (
  card: Card,
  update: UpdateCard,
  onRemoteMark: (card: Card, index: number) => void
) => {
  // A link with a room rejoins it, if this browser knows the player's name
  const [request, setRequest] = useState<Request | null>(() => {
    const room = readRoomParam();
    const name = savedPlayerName();
    return roomsAvailable && room && name ? { room, name } : null;
  });
  const [state, setState] = useState<RoomState>(() =>
    request ? { ...IDLE, status: "connecting", room: request.room } : IDLE
  );
  const handle = useRef<RoomHandle | null>(null);
  const latest = useRef({ card, update, onRemoteMark });

  useEffect(() => {
    latest.current = { card, update, onRemoteMark };
  });

  useEffect(() => {
    if (!request || !SERVER_URL) return;
    let cancelled = false;
    let opened: RoomHandle | undefined;
    import("../room/session").then(
      ({ openRoom }) => {
        if (cancelled) return;
        opened = handle.current = openRoom({
          url: SERVER_URL,
          ...request,
          getCard: () => latest.current.card,
          onState: setState,
          applyPatch: (patch) => latest.current.update(patch),
          onRemoteMark: (marked, index) => latest.current.onRemoteMark(marked, index),
        });
      },
      // Offline, or a deploy replaced the chunk: no room, the card is fine
      () => {
        if (!cancelled) setState({ ...IDLE, error: "unavailable" });
      }
    );
    return () => {
      cancelled = true;
      opened?.leave();
      handle.current = null;
    };
  }, [request]);

  useEffect(() => {
    handle.current?.cardChanged(card);
  }, [card]);

  const join = useCallback((room: string, name: string) => {
    savePlayerName(name);
    writeRoomParam(room);
    setState({ ...IDLE, status: "connecting", room });
    setRequest({ room, name });
  }, []);

  const leave = useCallback(() => {
    writeRoomParam("");
    setState(IDLE);
    setRequest(null);
  }, []);

  const editing: Editing = useMemo(() => {
    const names = new Map(state.players.map((player) => [player.id, player.name]));
    return {
      lockedBy: (target) => {
        if (state.status !== "joined") return undefined;
        const lock = state.locks.find((lock) => lock.target === target);
        return lock && lock.by !== state.you ? (names.get(lock.by) ?? "?") : undefined;
      },
      start: (target) => handle.current?.focus(target),
      end: (target) => handle.current?.blur(target),
    };
  }, [state]);

  return { state, join, leave, editing };
};
