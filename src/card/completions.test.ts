import { describe, expect, it } from "vitest";
import { newCompletions } from "./completions";

// Marks bitmask with these squares set
const marksOf = (...indices: number[]) =>
  indices.reduce((marks, i) => marks | (1 << i), 0);

const rules = { diagonals: false, everyLine: false };

describe("newCompletions", () => {
  it("is empty when the mark completes nothing", () => {
    expect(newCompletions(marksOf(0, 1, 2), 2, 16, rules)).toEqual([]);
  });

  it("finds a row", () => {
    expect(newCompletions(marksOf(0, 1, 2, 3), 2, 16, rules)).toEqual(["row"]);
  });

  it("finds a column", () => {
    expect(newCompletions(marksOf(1, 5, 9, 13), 9, 16, rules)).toEqual([
      "column",
    ]);
  });

  it("finds a row and a column completed by the same mark", () => {
    const marks = marksOf(0, 1, 2, 3, 4, 8, 12);
    expect(newCompletions(marks, 0, 16, rules)).toEqual(["row", "column"]);
  });

  it("only counts diagonals when they're turned on", () => {
    const marks = marksOf(0, 5, 10, 15);
    expect(newCompletions(marks, 10, 16, rules)).toEqual([]);
    expect(
      newCompletions(marks, 10, 16, { ...rules, diagonals: true })
    ).toEqual(["diagonal"]);
  });

  it("finds the anti-diagonal", () => {
    const marks = marksOf(3, 6, 9, 12);
    expect(
      newCompletions(marks, 6, 16, { ...rules, diagonals: true })
    ).toEqual(["diagonal"]);
  });

  it("only celebrates the first line unless everyLine is set", () => {
    const marks = marksOf(0, 1, 2, 3, 4, 5, 6, 7);
    expect(newCompletions(marks, 5, 16, rules)).toEqual([]);
    expect(
      newCompletions(marks, 5, 16, { ...rules, everyLine: true })
    ).toEqual(["row"]);
  });

  it("is only bingo when the whole card is marked", () => {
    const all = (1 << 16) - 1;
    expect(newCompletions(all, 7, 16, rules)).toEqual(["bingo"]);
    expect(
      newCompletions(all, 7, 16, { diagonals: true, everyLine: true })
    ).toEqual(["bingo"]);
  });

  it("works on a 5 × 5 card", () => {
    expect(
      newCompletions(marksOf(20, 21, 22, 23, 24), 24, 25, rules)
    ).toEqual(["row"]);
    expect(
      newCompletions(marksOf(0, 6, 12, 18, 24), 12, 25, {
        ...rules,
        diagonals: true,
      })
    ).toEqual(["diagonal"]);
    expect(newCompletions((1 << 25) - 1, 0, 25, rules)).toEqual(["bingo"]);
  });

  it("ignores marks on hidden squares of a 4 × 4 card", () => {
    // Squares 16-24 only exist on 5 × 5 cards
    const marks = marksOf(0, 1, 2, 3, 16, 17);
    expect(newCompletions(marks, 3, 16, rules)).toEqual(["row"]);
  });
});
