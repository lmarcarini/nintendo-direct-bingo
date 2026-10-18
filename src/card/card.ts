import { DEFAULT_MARKER, type Marker } from "./markers";
import { DEFAULT_THEME, type Theme } from "./themes";

export const MAX_SQUARES = 25;
export const SQUARE_COUNTS = [16, 25] as const;
export const DEFAULT_TITLE = "Nintendo Direct Bingo";

export type View = "edit" | "preview";
export type SquareCount = (typeof SQUARE_COUNTS)[number];

export type Card = {
  title: string;
  values: string[]; // always MAX_SQUARES long, including hidden squares
  nItems: SquareCount;
  view: View;
  theme: Theme;
  marks: number; // bit i set = square i marked as a hit
  marker: Marker; // drawn on marked squares
  animations: boolean; // full-screen celebrations
  diagonals: boolean; // diagonal lines celebrate too
  everyLine: boolean; // celebrate each new line, not only the first
};

export const DEFAULT_CARD: Card = {
  title: DEFAULT_TITLE,
  values: Array<string>(MAX_SQUARES).fill(""),
  nItems: 16,
  view: "edit",
  theme: DEFAULT_THEME,
  marks: 0,
  marker: DEFAULT_MARKER,
  animations: true,
  diagonals: false,
  everyLine: false,
};

export const isMarked = (marks: number, index: number) =>
  ((marks >> index) & 1) === 1;

export const toggleMark = (marks: number, index: number) =>
  marks ^ (1 << index);
