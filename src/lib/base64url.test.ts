import { describe, expect, it } from "vitest";
import { fromBase64Url, toBase64Url } from "./base64url";

describe("base64url", () => {
  it("round-trips every byte value without +, / or padding", () => {
    const bytes = Uint8Array.from({ length: 256 }, (_, i) => i);
    const encoded = toBase64Url(bytes);
    expect(encoded).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(fromBase64Url(encoded)).toEqual(bytes);
  });

  it("handles empty input", () => {
    expect(toBase64Url(new Uint8Array())).toBe("");
    expect(fromBase64Url("")).toEqual(new Uint8Array());
  });
});
