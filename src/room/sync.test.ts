import { describe, expect, it } from "vitest";
import { DEFAULT_CARD, DEFAULT_TITLE, MAX_SQUARES, type Card } from "../card/card";
import { DEFAULT_ROOM_CARD, type RoomCard, type Target } from "./protocol";
import {
  applyOps,
  applyToRoom,
  diffCard,
  fromRoomCard,
  patchFor,
  receivedCard,
  revertPatch,
  toRoomCard,
  type Change,
} from "./sync";

const squares = (...text: string[]) => [
  ...text,
  ...Array<string>(MAX_SQUARES - text.length).fill(""),
];

const nobody = () => false;
const room = (card: Partial<RoomCard> = {}) =>
  receivedCard({ ...DEFAULT_ROOM_CARD, ...card });
const local = (card: Partial<Card>) => toRoomCard({ ...DEFAULT_CARD, ...card });

describe("toRoomCard and fromRoomCard", () => {
  it("round-trip, keeping the local view mode", () => {
    const card: Card = {
      ...DEFAULT_CARD,
      title: "Direct",
      values: squares("Zelda", "Metroid"),
      nItems: 25,
      view: "preview",
      theme: "xbox",
      marks: 5,
      marker: "bean",
      animations: false,
      diagonals: true,
      everyLine: true,
    };
    expect(fromRoomCard(toRoomCard(card), "preview")).toEqual(card);
    expect(fromRoomCard(toRoomCard(card), "edit").view).toBe("edit");
  });

  it("cleans text the way the server does", () => {
    const card = local({ title: "a‮b", values: squares("x\u0007y") });
    expect(card.t).toBe("ab");
    expect(card.s[0]).toBe("xy");
  });

  it("maps a theme this version doesn't know to the default", () => {
    expect(fromRoomCard(room({ th: "future-theme" }), "edit").theme).toBe(
      DEFAULT_CARD.theme
    );
  });
});

describe("diffCard", () => {
  it("finds nothing when the card matches the room, default title included", () => {
    expect(diffCard(room(), local({}), null, nobody)).toEqual({ ops: [], reverts: [] });
    expect(room().t).toBe(DEFAULT_TITLE);
  });

  it("sends text for the target this client is editing", () => {
    expect(diffCard(room(), local({ values: squares("Zelda") }), 0, nobody)).toEqual({
      ops: [{ type: "text", target: 0, text: "Zelda" }],
      reverts: [],
    });
    expect(diffCard(room(), local({ title: "Mine" }), "title", nobody).ops).toEqual([
      { type: "text", target: "title", text: "Mine" },
    ]);
  });

  it("reverts text on targets this client isn't editing", () => {
    expect(diffCard(room(), local({ values: squares("", "x") }), 0, nobody)).toEqual({
      ops: [],
      reverts: [1],
    });
  });

  it("sends a mark per changed square", () => {
    expect(diffCard(room({ m: 0b01 }), local({ marks: 0b10 }), null, nobody).ops).toEqual([
      { type: "mark", i: 0, on: false },
      { type: "mark", i: 1, on: true },
    ]);
  });

  it("sends clear-marks when several marks go at once", () => {
    expect(diffCard(room({ m: 0b111 }), local({ marks: 0 }), null, nobody).ops).toEqual([
      { type: "clear-marks" },
    ]);
  });

  it("sends clear for an emptied card, keeping what others are typing", () => {
    const before = room({ s: squares("a", "b", "c"), m: 1 });
    const lockedByOther = (target: Target) => target === 2;
    expect(diffCard(before, local({}), null, lockedByOther)).toEqual({
      ops: [{ type: "clear" }],
      reverts: [2],
    });
    const after = applyOps(before, [{ type: "clear" }], lockedByOther);
    expect(after.s.slice(0, 3)).toEqual(["", "", "c"]);
    expect(after.m).toBe(0);
  });

  it("sends the changed settings in one message", () => {
    expect(
      diffCard(room(), local({ nItems: 25, theme: "rgb", diagonals: true }), null, nobody).ops
    ).toEqual([{ type: "settings", n: 25, th: "rgb", dg: 1 }]);
  });

  it("doesn't send back a theme this version showed as the default", () => {
    const unknown = room({ th: "future-theme" });
    const shown = toRoomCard(fromRoomCard(unknown, "edit"));
    expect(diffCard(unknown, shown, null, nobody).ops).toEqual([]);
    expect(diffCard(unknown, local({ theme: "xbox" }), null, nobody).ops).toEqual([
      { type: "settings", th: "xbox" },
    ]);
  });

  it("finds nothing once its own ops are applied", () => {
    const before = room({ s: squares("a"), m: 1 });
    const after = local({ values: squares("ab"), marks: 3, theme: "xbox" });
    const { ops } = diffCard(before, after, 0, nobody);
    expect(diffCard(applyOps(before, ops, nobody), after, 0, nobody).ops).toEqual([]);
  });
});

describe("changes from the server", () => {
  const card = { ...DEFAULT_CARD, values: squares("a", "b"), marks: 1 };

  it("patch the local card", () => {
    expect(patchFor(card, { type: "text", target: 1, text: "B" }).values?.slice(0, 2)).toEqual([
      "a",
      "B",
    ]);
    expect(patchFor(card, { type: "text", target: "title", text: "" })).toEqual({
      title: DEFAULT_TITLE,
    });
    expect(patchFor(card, { type: "mark", i: 0, on: false })).toEqual({ marks: 0 });
    expect(patchFor(card, { type: "settings", n: 25, th: "nope", a: 0 })).toEqual({
      nItems: 25,
      theme: DEFAULT_CARD.theme,
      animations: false,
    });
    expect(patchFor(card, { type: "cleared", squares: [0] })).toMatchObject({ marks: 0 });
  });

  it("and the room's copy the same way", () => {
    const change: Change = { type: "cleared", squares: [0] };
    expect(applyToRoom(toRoomCard(card), change)).toEqual(
      toRoomCard({ ...card, ...patchFor(card, change) })
    );
  });
});

describe("revertPatch", () => {
  it("puts the room's text back on the given targets only", () => {
    const card = { ...DEFAULT_CARD, title: "Mine", values: squares("x", "y") };
    expect(revertPatch(card, room({ t: "Room", s: squares("a", "b") }), ["title", 1])).toEqual({
      title: "Room",
      values: squares("x", "b"),
    });
    expect(revertPatch(card, room(), [])).toEqual({});
  });
});
