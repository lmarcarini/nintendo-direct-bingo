import { isMarked } from "./cardUrl";

export type Completion = "row" | "column" | "diagonal" | "bingo";

type Line = { kind: Completion; indices: number[] };

const linesOf = (size: number, diagonals: boolean): Line[] => {
  const range = Array.from({ length: size }, (_, i) => i);
  const lines: Line[] = [
    ...range.map((r) => ({
      kind: "row" as const,
      indices: range.map((c) => r * size + c),
    })),
    ...range.map((c) => ({
      kind: "column" as const,
      indices: range.map((r) => r * size + c),
    })),
  ];
  if (diagonals)
    lines.push(
      { kind: "diagonal", indices: range.map((i) => i * size + i) },
      { kind: "diagonal", indices: range.map((i) => i * size + size - 1 - i) }
    );
  return lines;
};

// What marking square `index` just completed. A full card is only "bingo",
// not also the lines it finished. Unless `everyLine` is set, lines only
// count while no other line was already complete
export const newCompletions = (
  marks: number,
  index: number,
  nItems: number,
  { diagonals, everyLine }: { diagonals: boolean; everyLine: boolean }
): Completion[] => {
  const allMarked = (indices: number[]) =>
    indices.every((i) => isMarked(marks, i));

  if (allMarked(Array.from({ length: nItems }, (_, i) => i))) return ["bingo"];

  const complete = linesOf(Math.sqrt(nItems), diagonals).filter((line) =>
    allMarked(line.indices)
  );
  const fresh = complete.filter((line) => line.indices.includes(index));
  if (!everyLine && complete.length > fresh.length) return [];
  return fresh.map((line) => line.kind);
};
