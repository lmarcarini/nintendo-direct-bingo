# CLAUDE.md

A small personal project: a bingo card maker that the owner and their friends use before Nintendo Directs. Keep changes simple and proportional to that. It needs no heavy abstractions, state libraries or test frameworks unless a feature calls for one.

## Commands

```bash
npm run dev       # Vite dev server
npm run build     # tsc type-check + vite build (the main correctness check)
npm run lint      # ESLint, --max-warnings 0
npm run preview   # serve dist/
```

There are no tests. Verify changes with `npm run build` and `npm run lint`, and by running the app.

Node version comes from `.nvmrc` (24 LTS); run `nvm use`. `package.json` `engines` matches Vite 8 / Rolldown (`^20.19.0 || >=22.12.0`), and `.npmrc` sets `engine-strict=true`. Without that, npm on an older Node silently skips the optional `@rolldown/binding-*` package (its `engines` doesn't match) and the build later fails with "Cannot find native binding". Keep `engines` in sync when upgrading Vite.

## Stack

React 19, TypeScript (strict), Vite 8 with `@vitejs/plugin-react`, ESLint 10 flat config (`eslint.config.js`). The only runtime dependency besides React is `modern-screenshot` (the "Copy image" and share screenshots), which is loaded with a dynamic `import()` so it stays out of the main bundle. It is a static client-only app with no backend.

## Layout

- `src/main.tsx`: awaits `readCard` (decompression is async), then renders `App` with the decoded card.
- `src/App.tsx`: the whole app (title, squares, marks, buttons, options panel, celebrations).
- `src/themes.ts`: theme ids and labels. Each id has a `[data-theme="…"]` block in `index.css` that overrides the color custom properties; `App` sets `data-theme` on `<html>`. The blocks aren't limited to `:root` so the theme picker chips can each show their own theme's colors; effects that should only apply to the page use `:root[data-theme="…"]`.
- `src/utils/cardUrl.ts`: the `Card` type and reading/writing it to the URL.
- `src/utils/completions.ts`: which rows, columns, diagonals or full card ("bingo") a new mark just completed, given the card's celebration settings.
- `src/utils/share.ts`: screenshot of `.bingo-card` (PNG at 2×), copying it or the link to the clipboard, and the Web Share API (the Share button only shows where `navigator.share` exists; it attaches the screenshot where `navigator.canShare` accepts files). `copyImage` takes a `Promise<Blob>` so the clipboard write starts inside the click, which Safari requires.
- `src/utils/adjustFontSize.ts`: binary-searches the largest font size (8–36px) at which a square's text fits, breaking words only when one is too long even at 8px. It measures overflow via `scrollHeight`/`scrollWidth`, so it depends on `.bingo-input` using `justify-content: safe center` (plain `center` spills overflow upwards, where it isn't measured).
- `src/index.css`: all styles (theme variables, layout, card, grid, marks, buttons, Gilroy font).
- `public/`: `Gilroy-Bold.woff` (title font) and `letter-b-16.ico` (favicon).

## How state works

The URL is the only persistence (`src/utils/cardUrl.ts`). The whole card is one query param, `c`: JSON with short keys, deflate-raw compressed (`CompressionStream`), then base64url. Fields that hold their default value are left out, and a default card has no `c` at all.

| Key  | Value                                                      |
| ---- | ---------------------------------------------------------- |
| `t`  | title (default "Nintendo Direct Bingo")                    |
| `s`  | square text, array of up to 25; trailing empty squares dropped |
| `n`  | `25` (default 16)                                          |
| `v`  | `"p"` for view mode (default edit)                         |
| `th` | theme id from `themes.ts` (default `nintendo`)             |
| `m`  | marks bitmask, bit i = square i hit                        |
| `a`  | `0` turns celebrations off (default on)                    |
| `dg` | `1` makes diagonals count as lines (default off)           |
| `el` | `1` celebrates every new line, not only the first (default off) |

- Backward compatibility with old links is not a goal. Changing the format is fine.
- `App` holds the card in one `useState<Card>`, and an effect calls `writeCard` whenever it changes. `writeCard` uses `history.replaceState` (no history entry per keystroke) and drops a write if a newer one started while it was compressing.
- `readCard` validates every field and caps decompressed size, falling back to a default card on any error.
- Squares and the title are uncontrolled `contentEditable="plaintext-only"` elements. React does not own their content: a ref callback (`fillOnce`) fills `textContent` once when the element mounts, and `onInput` reads `innerText` back into the card state. Don't render their text as React children; React would clash with the browser's edits.
- Content is only ever set with `textContent`, never `innerHTML`. Links are shared, so the URL is untrusted input; keep it that way.
- View mode turns off `contentEditable`, hides the edit controls, and makes squares buttons (`role="button"`, `aria-pressed`) that toggle marks on click, Enter or Space. Marks live in the URL, so a shared link carries them.
- Celebration settings are part of the card, so everyone with the link plays by the same rules.
- A mark that completes a row, a column, a diagonal (if enabled) or the whole card shows a full-screen `.celebration` overlay (one per completion, queued in `App`). It's styled per theme in `index.css` from the theme colors, with extra effects for some themes, and is removed when its `celebration-fade` animation ends.

## Roadmap

Themes, editable title, shorter links and marks are done. Remaining:

1. **Rooms over WebSockets**: shared real-time sessions for playing together. This is the only feature that needs a server, so it adds a backend and hosting. Reuse the `c` payload from `cardUrl.ts` as the sync format. Keep the URL-only, no-backend model for everything else.
