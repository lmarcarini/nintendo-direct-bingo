import { describe, expect, it } from "vitest";
import { DEFAULT_CARD, MAX_SQUARES, type Card } from "./card";
import { fromPayload, toPayload } from "./payload";

const squares = (...text: string[]) => [
  ...text,
  ...Array<string>(MAX_SQUARES - text.length).fill(""),
];

const custom: Card = {
  title: "My Direct",
  values: squares("Zelda", "", "Mario Kart"),
  nItems: 25,
  view: "preview",
  theme: "xbox",
  marks: 0b101,
  marker: "bean",
  animations: false,
  diagonals: true,
  everyLine: true,
};

describe("toPayload", () => {
  it("leaves a default card empty", () => {
    expect(toPayload(DEFAULT_CARD)).toEqual({});
  });

  it("writes every field that isn't at its default", () => {
    expect(toPayload(custom)).toEqual({
      t: "My Direct",
      s: ["Zelda", "", "Mario Kart"],
      n: 25,
      v: "p",
      th: "xbox",
      m: 0b101,
      mk: "bean",
      a: 0,
      dg: 1,
      el: 1,
    });
  });

  it("drops trailing empty squares but keeps the ones in between", () => {
    const card = { ...DEFAULT_CARD, values: squares("", "b", "", "") };
    expect(toPayload(card).s).toEqual(["", "b"]);
  });

  it("leaves out an empty title", () => {
    expect(toPayload({ ...DEFAULT_CARD, title: "" })).toEqual({});
  });
});

describe("fromPayload", () => {
  it("round-trips a card", () => {
    expect(fromPayload(toPayload(custom))).toEqual(custom);
    expect(fromPayload(toPayload(DEFAULT_CARD))).toEqual(DEFAULT_CARD);
  });

  it.each([null, undefined, "card", 42, [], true])(
    "falls back to the default card for %j",
    (data) => {
      expect(fromPayload(data)).toEqual(DEFAULT_CARD);
    }
  );

  it("replaces invalid fields with their defaults", () => {
    expect(
      fromPayload({
        t: 7,
        s: "not an array",
        n: 9,
        v: "x",
        th: "gamecube",
        m: "5",
        mk: "<img>",
        a: false,
        dg: true,
        el: "1",
      })
    ).toEqual(DEFAULT_CARD);
  });

  it("uses the default title for an empty one", () => {
    expect(fromPayload({ t: "" }).title).toBe(DEFAULT_CARD.title);
  });

  it("always has MAX_SQUARES squares, all strings", () => {
    const { values } = fromPayload({
      s: ["a", 2, null, { x: 1 }, ...Array(40).fill("z")],
    });
    expect(values).toHaveLength(MAX_SQUARES);
    expect(values.slice(0, 5)).toEqual(["a", "", "", "", "z"]);
  });

  it("keeps marks within the card's squares", () => {
    expect(fromPayload({ m: -1 }).marks).toBe((1 << MAX_SQUARES) - 1);
    expect(fromPayload({ m: 1 << 30 }).marks).toBe(0);
    expect(fromPayload({ m: 1.5 }).marks).toBe(0);
  });
});
