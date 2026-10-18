import { describe, expect, it } from "vitest";
import { compress, decompress } from "./deflate";

describe("deflate", () => {
  it("round-trips text", async () => {
    const text = "Bingo! ".repeat(100) + "ção 🍄";
    expect(await decompress(await compress(text), 10_000)).toBe(text);
  });

  it("throws past the size limit", async () => {
    const bytes = await compress("x".repeat(5_000));
    await expect(decompress(bytes, 1_000)).rejects.toThrow();
  });
});
