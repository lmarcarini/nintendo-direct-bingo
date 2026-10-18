import { describe, expect, it } from "vitest";
import { toBase64Url } from "../lib/base64url";
import { compress } from "../lib/deflate";
import { DEFAULT_CARD, type Card } from "./card";
import { decodeCard, encodeCard } from "./encoding";

const encodeText = async (text: string) => toBase64Url(await compress(text));

const card: Card = {
  ...DEFAULT_CARD,
  title: "Nintendo Direct — Março 🍄",
  values: DEFAULT_CARD.values.map((_, i) => (i % 3 ? "" : `Square ${i}`)),
  nItems: 25,
  marks: 0b1011,
  theme: "neo-tokyo",
};

describe("encodeCard / decodeCard", () => {
  it("encodes a default card to an empty string, and back", async () => {
    expect(await encodeCard(DEFAULT_CARD)).toBe("");
    expect(await decodeCard("")).toEqual(DEFAULT_CARD);
  });

  it("round-trips a card, including non-ASCII text", async () => {
    expect(await decodeCard(await encodeCard(card))).toEqual(card);
  });

  it("only uses URL-safe characters", async () => {
    expect(await encodeCard(card)).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it.each([
    ["not base64", "%%%"],
    ["base64 that isn't deflate", "aGVsbG8gd29ybGQ"],
  ])("decodes %s to the default card", async (_, encoded) => {
    expect(await decodeCard(encoded)).toEqual(DEFAULT_CARD);
  });

  it("decodes deflated text that isn't JSON to the default card", async () => {
    expect(await decodeCard(await encodeText("{nope"))).toEqual(DEFAULT_CARD);
  });

  it("refuses a payload that decompresses past the size limit", async () => {
    // Compresses to a short link, but would expand into a huge string
    const huge = JSON.stringify({ t: "x".repeat(200_000) });
    const encoded = await encodeText(huge);
    expect(encoded.length).toBeLessThan(2_000);
    expect(await decodeCard(encoded)).toEqual(DEFAULT_CARD);
  });
});
