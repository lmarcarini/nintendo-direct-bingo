// What's drawn on top of a marked square. Each id other than "none" has a
// `[data-marker="…"]` block in index.css; "theme" picks a different marker
// per theme. Labels are translated, in src/i18n
export const MARKERS = [
  "none",
  "theme",
  "bean",
  "check",
  "circle",
  "thumbs",
] as const;

export type Marker = (typeof MARKERS)[number];

export const DEFAULT_MARKER: Marker = "none";

export const isMarker = (value: unknown): value is Marker =>
  MARKERS.some((marker) => marker === value);
