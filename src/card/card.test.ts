import { describe, expect, it } from "vitest";
import { isMarked, toggleMark } from "./card";

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
