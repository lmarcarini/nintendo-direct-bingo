import { describe, expect, it } from "vitest";
import { clampText, isMarked, toggleMark } from "./card";

describe("marks", () => {
  it("toggles a square on and off", () => {
    const marks = toggleMark(0, 3);
    expect(isMarked(marks, 3)).toBe(true);
    expect(isMarked(marks, 2)).toBe(false);
    expect(toggleMark(marks, 3)).toBe(0);
  });

  it("keeps other squares when toggling", () => {
    const marks = toggleMark(toggleMark(0, 0), 24);
    expect(isMarked(marks, 0)).toBe(true);
    expect(isMarked(marks, 24)).toBe(true);
    expect(isMarked(toggleMark(marks, 0), 24)).toBe(true);
  });
});

describe("clampText", () => {
  it("leaves short text alone and cuts long text", () => {
    expect(clampText("abc", 3)).toBe("abc");
    expect(clampText("abcd", 3)).toBe("abc");
  });

  it("never splits an emoji's surrogate pair", () => {
    expect(clampText("😀😀😀", 2)).toBe("😀😀");
  });
});
