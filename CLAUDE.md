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

React 19, TypeScript (strict), Vite 8 with `@vitejs/plugin-react`, ESLint 10 flat config (`eslint.config.js`). No runtime dependencies besides React. It is a static client-only app with no backend.

## Layout

- `src/App.tsx`: the whole app (card, buttons, size selector).
- `src/utils/cardUrl.ts`: reading and writing the card to the URL.
- `src/utils/adjustFontSize.ts`: binary-searches the largest font size (8–36px) at which a square's text fits, breaking words only when one is too long even at 8px. It measures overflow via `scrollHeight`/`scrollWidth`, so it depends on `.bingo-input` using `justify-content: safe center` (plain `center` spills overflow upwards, where it isn't measured).
- `src/index.css`: all styles (layout, card, grid, buttons, Gilroy font).
- `public/`: `Gilroy-Bold.woff` (title font) and `letter-b-16.ico` (favicon).

## How state works

The URL query string is the only persistence (`src/utils/cardUrl.ts`). Format:

| Param    | Value                                         |
| -------- | --------------------------------------------- |
| `0`–`24` | square text, UTF-8 then base64url; empty squares omitted |
| `nItems` | `16` or `25`                                  |
| `view`   | `edit` or `preview`                           |

- Backward compatibility with old links is not a goal. Changing the format is fine.
- All URL writes go through `updateUrl`, which uses `history.replaceState` (no history entry per keystroke).
- Squares are uncontrolled `contentEditable="plaintext-only"` divs. React does not own their content: a ref callback fills each square's `textContent` once when it mounts, and `onInput` reads `innerText` back into the `values` ref and the URL. Don't render square text as React children; React would clash with the browser's edits.
- Content is only ever set with `textContent`, never `innerHTML`. Links are shared, so the URL is untrusted input; keep it that way.
- `view=preview` turns off `contentEditable` and hides the edit controls.

## Roadmap

Planned features, roughly in order. Keep the URL-only, no-backend model for everything except rooms.

1. **Themes**: selectable color schemes. The colors are hardcoded in `index.css` (`#fe0016` card, `#213547` background, white squares). Move them to CSS custom properties and switch a theme class or `data-theme`. Persist the choice in the URL.
2. **Editable title**: the `<h1>` is hardcoded. Make it editable in edit mode and store it in the URL.
3. **Review URL saving**: mostly done (UTF-8-safe plain text, `replaceState`). Still open: shorter links, e.g. compressing the whole card into one param.
4. **Mark matches in view mode**: click a square in preview to toggle it as hit. Decide whether marks live in the URL (shareable) or locally (personal). Text selection is already disabled in view mode (`user-select: none`).
5. **Rooms over WebSockets**: shared real-time sessions for playing together. This is the only feature that needs a server, so it adds a backend and hosting. Do it last, and reuse the card format from item 3 as the sync payload.
