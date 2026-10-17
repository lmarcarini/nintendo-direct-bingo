// The default theme is the plain `:root` block in index.css; each other id
// has a matching `:root[data-theme="…"]` block that overrides its colors
export const THEMES = [
  { id: "nintendo", label: "Nintendo" },
  { id: "playstation", label: "PlayStation" },
  { id: "xbox", label: "Xbox" },
  { id: "game-awards", label: "The Game Awards" },
  { id: "rgb", label: "RGB Battlestation" },
  { id: "neo-tokyo", label: "Neo Tokyo Arcade" },
  { id: "white-build", label: "White Build" },
] as const;

export type Theme = (typeof THEMES)[number]["id"];

export const DEFAULT_THEME: Theme = "nintendo";

export const isTheme = (value: unknown): value is Theme =>
  THEMES.some((theme) => theme.id === value);
