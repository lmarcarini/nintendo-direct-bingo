// What's drawn on top of a marked square. Each id other than "none" has a
// `[data-marker="…"]` block in index.css; "theme" picks a different marker
// per theme
export const MARKERS = [
  { id: "none", label: "None" },
  { id: "theme", label: "Thematic" },
  { id: "bean", label: "Bean" },
  { id: "check", label: "Checkmark" },
  { id: "circle", label: "Circle" },
  { id: "thumbs", label: "Thumbs up" },
] as const;

export type Marker = (typeof MARKERS)[number]["id"];

export const DEFAULT_MARKER: Marker = "none";

export const isMarker = (value: unknown): value is Marker =>
  MARKERS.some((marker) => marker.id === value);
