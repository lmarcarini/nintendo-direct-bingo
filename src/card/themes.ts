// Colors live in styles/themes.css: the default theme is the `:root` block,
// and each other id has a `[data-theme="…"]` block that overrides them
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
