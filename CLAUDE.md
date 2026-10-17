# CLAUDE.md

A small personal project: a bingo card maker that the owner and their friends use before Nintendo Directs. Keep changes simple and proportional to that. It needs no heavy abstractions or state libraries unless a feature calls for one.

## Commands

```bash
npm run dev       # Vite dev server
npm run build     # tsc type-check + vite build (the main correctness check)
npm run lint      # ESLint, --max-warnings 0
npm test          # Vitest (watches in a terminal; `npm test -- run` runs once)
npm run preview   # serve dist/
```

Verify changes with `npm test`, `npm run build` and `npm run lint`, and by running the app.

Node version comes from `.nvmrc` (24 LTS); run `nvm use`. `package.json` `engines` is where Vite 8 / Rolldown (`^20.19.0 || >=22.12.0`) and Vitest 5 (`^22.12.0 || ^24.0.0 || >=26.0.0`) overlap, and `.npmrc` sets `engine-strict=true`. Without that, npm on an older Node silently skips the optional `@rolldown/binding-*` package (its `engines` doesn't match) and the build later fails with "Cannot find native binding". Keep `engines` in sync when upgrading Vite or Vitest.

## Tests

- **Unit tests (Vitest)** cover the pure modules: `card/` and the encoding helpers in `lib/`. They sit next to the file they test (`payload.ts` → `payload.test.ts`), import `describe`/`it`/`expect` from `vitest` (no globals) and run in plain Node, which has `CompressionStream` built in, so there's no jsdom and no Vitest config. Add a test when changing completion rules or the payload/encoding format; `decodeCard` takes untrusted input, so cover new invalid cases there too.
- **No component tests in jsdom.** The UI depends on things jsdom doesn't have: `innerText`, real layout (`scrollHeight` is always 0, so font fitting can't run) and `contentEditable`. Those tests would mostly check mocks.
- **Browser tests (Playwright) come with rooms**, not before. Solo play is URL-only and quick to check by hand. Real-time sync isn't, and Playwright can open two browser contexts in one test: mark in one and check the other, reconnects, two people editing at once, and that the solo card keeps working when the room server is down. Keep it to a handful of flows so it stays fast and doesn't get flaky. It needs its browsers downloaded (`npx playwright install chromium`), locally and in any CI. Run the browsers with a fixed `locale` and `timezoneId`: the language is picked from the time zone, so on a Brazilian machine the UI comes up in Portuguese.

## Stack

React 19, TypeScript (strict), Vite 8 with `@vitejs/plugin-react`, ESLint 10 flat config (`eslint.config.js`). The only runtime dependency besides React is `modern-screenshot` (the "Copy image" and share screenshots), which is loaded with a dynamic `import()` so it stays out of the main bundle. It is a static client-only app with no backend.

## Layout

Domain logic (no React) lives in `card/`, generic browser helpers in `lib/`, React state in `hooks/`, UI in `components/`, one concern per file. Import files directly; there are no barrel `index.ts` files.

- `src/main.tsx`: awaits `readCard` (decompression is async), then renders `App` with the decoded card.
- `src/App.tsx`: composition only. Holds the card (`useCard`), language and celebration queue, and the one rule that crosses them: a mark that completes a line celebrates.
- `src/card/`: the card model, no React.
  - `card.ts`: the `Card` type, `DEFAULT_CARD`, `isMarked`/`toggleMark`.
  - `payload.ts`: `Card` ⇄ short-key JSON (`toPayload`/`fromPayload`, which validates every field).
  - `encoding.ts`: `encodeCard`/`decodeCard`, the card as one compressed string. This is the `c` param and the format rooms will sync.
  - `cardUrl.ts`: `readCard`/`writeCard`, the encoded card in the URL.
  - `completions.ts`: which rows, columns, diagonals or full card ("bingo") a new mark just completed, given the card's celebration settings.
  - `themes.ts`: theme ids and labels. Each id has a `[data-theme="…"]` block in `styles/themes.css` that overrides the color custom properties; `useDocumentTheme` sets `data-theme` on `<html>`. The blocks aren't limited to `:root` so the theme picker chips can each show their own theme's colors; effects that should only apply to the page use `:root[data-theme="…"]`.
  - `markers.ts`: marker ids (what's drawn on a marked square; labels are in the translations). Each id but `none` has a `[data-marker="…"]` block in `styles/markers.css` that sets `--marker-shape` (an SVG mask) and color for the `.bingo-input--marked::after` pseudo-element, drawn in the square's bottom-right corner; `thematic` (`theme`) has one block per theme.
- `src/lib/`: generic helpers that know nothing about cards. `base64url.ts`, `deflate.ts` (with a decompressed size cap), `screenshot.ts` (PNG at 2×, `modern-screenshot` loaded on first use), `clipboard.ts` (`copyImage` takes a `Promise<Blob>` so the clipboard write starts inside the click, which Safari requires), `share.ts` (Web Share API; the Share button only shows where `navigator.share` exists, and the screenshot is attached where `navigator.canShare` accepts files), and `adjustFontSize.ts`: binary-searches the largest font size (8–36px) at which a square's text fits, breaking words only when one is too long even at 8px. It measures overflow via `scrollHeight`/`scrollWidth`, so it depends on `.bingo-input` using `justify-content: safe center` (plain `center` spills overflow upwards, where it isn't measured).
- `src/hooks/`: `useCard` (state + saving to the URL), `useEditableText` (see below), `useFitText` (refits a square on text change and resize), `useCelebrations` (the overlay queue), `useNotice` (the timed share notice), `useDocumentTheme`, `useDocumentTitle`.
- `src/i18n/`: UI translations. `en.ts` is the reference, and its shape is the `Messages` type (`messages.ts`), so another language missing a string fails the build. `languages.ts` lists the `LANGUAGES`; `preference.ts` picks one: the choice saved in `localStorage` (only saved when someone picks from the footer picker), else a language whose `timeZones` include the browser's time zone (the location hint), else the first of `navigator.languages` that matches, else English. `useLanguage` holds it and sets `<html lang>`; `App` provides the messages through `MessagesContext`, and components read them with `useMessages()`. The language belongs to the viewer and is not in the card or URL. To add one, write a `Messages` file and add an entry to `LANGUAGES`. Theme names and the default card title aren't translated.
- `src/components/`: `card/` (`BingoCard`, `CardTitle`, `Square`), `actions/` (`ShareActions`, `CardActions`), `options/` (`OptionsPanel` and one component per fieldset), `ui/` (`Icon`, `Switch`), plus `LanguagePicker` and `Celebration`. Components get narrow props (a value and an `onChange`) where they can; the ones that act on the whole card take `card` and `update`.
- `src/styles/`: one file per concern, `@import`ed by `index.css` in cascade order (themes, base, card, buttons, language picker, options, pickers, switch, markers, theme extras, celebration). Keep new rules in the file for their concern, and mind the order when a rule relies on overriding an earlier one.
- `public/`: `Gilroy-Bold.woff` (title font, preloaded from `index.html`) and `letter-b-16.ico` (favicon).

## How state works

The URL is the only persistence (`src/card/cardUrl.ts`, encoding in `encoding.ts` and `payload.ts`). The whole card is one query param, `c`: JSON with short keys, deflate-raw compressed (`CompressionStream`), then base64url. Fields that hold their default value are left out, and a default card has no `c` at all.

| Key  | Value                                                      |
| ---- | ---------------------------------------------------------- |
| `t`  | title (default "Nintendo Direct Bingo")                    |
| `s`  | square text, array of up to 25; trailing empty squares dropped |
| `n`  | `25` (default 16)                                          |
| `v`  | `"p"` for view mode (default edit)                         |
| `th` | theme id from `themes.ts` (default `nintendo`)             |
| `m`  | marks bitmask, bit i = square i hit                        |
| `mk` | marker id from `markers.ts` drawn on marked squares (default `none`) |
| `a`  | `0` turns celebrations off (default on)                    |
| `dg` | `1` makes diagonals count as lines (default off)           |
| `el` | `1` celebrates every new line, not only the first (default off) |

- Backward compatibility with old links is not a goal. Changing the format is fine.
- `useCard` holds the card in one `useState<Card>`, and an effect calls `writeCard` whenever it changes. Every change goes through its `update(patch | card => patch)`, which is where rooms will hook in. `writeCard` uses `history.replaceState` (no history entry per keystroke) and drops a write if a newer one started while it was compressing.
- `readCard` validates every field and caps decompressed size, falling back to a default card on any error.
- Squares and the title are uncontrolled `contentEditable="plaintext-only"` elements. React does not own their content: `onInput` reads `innerText` back into the card state (normalized: trimmed, and whitespace collapsed for the title), and `useEditableText` writes the state's text into the element only when it differs from the normalized `innerText`, so on mount, on Clear, or when the card changes from elsewhere (rooms), but never while the person types. Don't render their text as React children; React would clash with the browser's edits.
- Content is only ever set with `textContent`, never `innerHTML`. Links are shared, so the URL is untrusted input; keep it that way.
- View mode turns off `contentEditable`, hides the edit controls, and makes squares buttons (`role="button"`, `aria-pressed`) that toggle marks on click, Enter or Space. Marks live in the URL, so a shared link carries them.
- Celebration settings are part of the card, so everyone with the link plays by the same rules.
- A mark that completes a row, a column, a diagonal (if enabled) or the whole card shows a full-screen `.celebration` overlay (one per completion, queued in `App`). It's styled per theme in `index.css` from the theme colors, with extra effects for some themes, and is removed when its `celebration-fade` animation ends.

## Roadmap

Themes, editable title, shorter links and marks are done. Remaining:

1. **Rooms over WebSockets**: shared real-time sessions for playing together. This is the only feature that needs a server, so it adds a backend and hosting. Rooms are an optional layer on top of the app as it is, never a dependency: the card works offline and solo exactly as it does now, and if the room server is down, unreachable or drops mid-game, the bingo keeps working locally (the URL still saves the card). Room code must not be on the startup path, and its failures can't break the card. Reuse `encodeCard`/`decodeCard` (`card/encoding.ts`) as the sync format, and plug into `useCard`. Load the room client with a dynamic `import()` only when someone joins a room, so solo play doesn't pay for it. Keep the URL-only, no-backend model for everything else.
