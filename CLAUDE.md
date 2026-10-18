# CLAUDE.md

A small personal project: a bingo card maker that the owner and their friends use before Nintendo Directs. Keep changes simple and proportional to that. It needs no heavy abstractions or state libraries unless a feature calls for one.

## Commands

```bash
npm run dev       # Vite dev server
npm run build     # tsc type-check + vite build (the main correctness check)
npm run lint      # ESLint, --max-warnings 0
npm test          # Vitest (watches in a terminal; `npm test -- run` runs once)
npm run test:e2e  # Playwright: rooms, two players per test (see Tests)
npm run preview   # serve dist/
```

Verify changes with `npm test`, `npm run build` and `npm run lint`, and by running the app. Room changes also need `npm run test:e2e`.

Node version comes from `.nvmrc` (24 LTS); run `nvm use`. `package.json` `engines` is where Vite 8 / Rolldown (`^20.19.0 || >=22.12.0`) and Vitest 5 (`^22.12.0 || ^24.0.0 || >=26.0.0`) overlap, and `.npmrc` sets `engine-strict=true`. Without that, npm on an older Node silently skips the optional `@rolldown/binding-*` package (its `engines` doesn't match) and the build later fails with "Cannot find native binding". Keep `engines` in sync when upgrading Vite or Vitest.

## Tests

- **Unit tests (Vitest)** cover the pure modules: `card/` and the encoding helpers in `lib/`. They sit next to the file they test (`payload.ts` → `payload.test.ts`), import `describe`/`it`/`expect` from `vitest` (no globals) and run in plain Node, which has `CompressionStream` built in, so there's no jsdom and no Vitest config. Add a test when changing completion rules or the payload/encoding format; `decodeCard` takes untrusted input, so cover new invalid cases there too.
- **No component tests in jsdom.** The UI depends on things jsdom doesn't have: `innerText`, real layout (`scrollHeight` is always 0, so font fitting can't run) and `contentEditable`. Those tests would mostly check mocks.
- **Browser tests (Playwright)** cover rooms, in `e2e/*.e2e.ts` (that suffix keeps Vitest away from them): `npm run test:e2e`. Each test opens two browser contexts, as two players. They cover shared text, marks and settings, locks, Clear, the default title, a reconnect, and the solo card working when the server can't be reached (`page.routeWebSocket` fakes drops and outages). `playwright.config.ts` starts the Vite dev server and the room server from `../nintendo-direct-bingo-server`, which needs its dependencies installed. Locally it reuses servers already running on 5173 and 8080. Keep it to a handful of flows so it stays fast (about 5s) and doesn't get flaky. It needs its browsers downloaded (`npx playwright install chromium`), locally and in any CI. The browsers run with a fixed `locale` and `timezoneId`: the language is picked from the time zone, so on a Brazilian machine the UI would come up in Portuguese. Solo play is URL-only and quick to check by hand.

## Stack

React 19, TypeScript (strict), Vite 8 with `@vitejs/plugin-react`, ESLint 10 flat config (`eslint.config.js`). The only runtime dependency besides React is `modern-screenshot` (the "Copy image" and share screenshots), which is loaded with a dynamic `import()` so it stays out of the main bundle. The app itself is static, client-only and hosted on Netlify. Rooms use a separate WebSocket server (see Rooms), and the app never depends on it.

## Layout

Domain logic (no React) lives in `card/`, generic browser helpers in `lib/`, React state in `hooks/`, UI in `components/`, one concern per file. Import files directly; there are no barrel `index.ts` files.

- `src/main.tsx`: awaits `readCard` (decompression is async), then renders `App` with the decoded card.
- `src/App.tsx`: composition only. Holds the card (`useCard`), language and celebration queue, and the one rule that crosses them: a mark that completes a line celebrates.
- `src/room/`: the room client (see Rooms): `protocol.ts` (the server's, copied), `sync.ts`, `session.ts`, and `remembered.ts` (the only one loaded at startup).
- `src/card/`: the card model, no React.
  - `card.ts`: the `Card` type, `DEFAULT_CARD`, the text limits and `clampText`, `isMarked`/`toggleMark`.
  - `payload.ts`: `Card` ⇄ short-key JSON (`toPayload`/`fromPayload`, which validates every field).
  - `encoding.ts`: `encodeCard`/`decodeCard`, the card as one compressed string. This is the `c` param.
  - `cardUrl.ts`: `readCard`/`writeCard`, the encoded card in the URL.
  - `completions.ts`: which rows, columns, diagonals or full card ("bingo") a new mark just completed, given the card's celebration settings.
  - `themes.ts`: theme ids and labels. Each id has a `[data-theme="…"]` block in `styles/themes.css` that overrides the color custom properties; `useDocumentTheme` sets `data-theme` on `<html>`. The blocks aren't limited to `:root` so the theme picker chips can each show their own theme's colors; effects that should only apply to the page use `:root[data-theme="…"]`.
  - `markers.ts`: marker ids (what's drawn on a marked square; labels are in the translations). Each id but `none` has a `[data-marker="…"]` block in `styles/markers.css` that sets `--marker-shape` (an SVG mask) and color for the `.bingo-input--marked::after` pseudo-element, drawn in the square's bottom-right corner; `thematic` (`theme`) has one block per theme.
- `src/lib/`: generic helpers that know nothing about cards. `base64url.ts`, `deflate.ts` (with a decompressed size cap), `screenshot.ts` (PNG at 2×, `modern-screenshot` loaded on first use), `clipboard.ts` (`copyImage` takes a `Promise<Blob>` so the clipboard write starts inside the click, which Safari requires), `share.ts` (Web Share API; the Share button only shows where `navigator.share` exists, and the screenshot is attached where `navigator.canShare` accepts files), and `adjustFontSize.ts`: binary-searches the largest font size (8–36px) at which a square's text fits, breaking words only when one is too long even at 8px. It measures overflow via `scrollHeight`/`scrollWidth`, so it depends on `.bingo-input` using `justify-content: safe center` (plain `center` spills overflow upwards, where it isn't measured).
- `src/hooks/`: `useCard` (state + saving to the URL), `useRoom` (the room session, see Rooms), `useEditableText` (see below), `useFitText` (refits a square on text change and resize), `useCelebrations` (the overlay queue), `useNotice` (the timed share notice), `useDocumentTheme`, `useDocumentTitle`.
- `src/i18n/`: UI translations. `en.ts` is the reference, and its shape is the `Messages` type (`messages.ts`), so another language missing a string fails the build. `languages.ts` lists the `LANGUAGES`; `preference.ts` picks one: the choice saved in `localStorage` (only saved when someone picks from the footer picker), else a language whose `timeZones` include the browser's time zone (the location hint), else the first of `navigator.languages` that matches, else English. `useLanguage` holds it and sets `<html lang>`; `App` provides the messages through `MessagesContext`, and components read them with `useMessages()`. The language belongs to the viewer and is not in the card or URL. To add one, write a `Messages` file and add an entry to `LANGUAGES`. Theme names and the default card title aren't translated.
- `src/components/`: `card/` (`BingoCard`, `CardTitle`, `Square`), `actions/` (`ShareActions`, `CardActions`), `options/` (`OptionsPanel` and one component per fieldset), `room/` (`RoomPanel`: join form, status, players), `ui/` (`Icon`, `Switch`), plus `LanguagePicker` and `Celebration`. Components get narrow props (a value and an `onChange`) where they can; the ones that act on the whole card take `card` and `update`.
- `src/styles/`: one file per concern, `@import`ed by `index.css` in cascade order (themes, base, card, buttons, language picker, options, pickers, switch, room, markers, theme extras, celebration). Keep new rules in the file for their concern, and mind the order when a rule relies on overriding an earlier one.
- `public/`: `Gilroy-Bold.woff` (title font, preloaded from `index.html`) and `letter-b-16.ico` (favicon).

## How state works

The URL is the only persistence (`src/card/cardUrl.ts`, encoding in `encoding.ts` and `payload.ts`). The whole card is one query param, `c` (`writeCard` leaves other params alone: `room`, see Rooms): JSON with short keys, deflate-raw compressed (`CompressionStream`), then base64url. Fields that hold their default value are left out, and a default card has no `c` at all.

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
- `useCard` holds the card in one `useState<Card>`, and an effect calls `writeCard` whenever it changes. Every change goes through its `update(patch | card => patch)`, local or from the room. `writeCard` uses `history.replaceState` (no history entry per keystroke) and drops a write if a newer one started while it was compressing.
- `readCard` validates every field and caps decompressed size, falling back to a default card on any error. Text over the limits is cut.
- Squares and the title are uncontrolled `contentEditable="plaintext-only"` elements. React does not own their content: `onInput` reads `innerText` back into the card state (normalized: trimmed, and whitespace collapsed for the title), and `useEditableText` writes the state's text into the element only when it differs from the normalized `innerText`, so on mount, on Clear, or when the card changes from elsewhere (rooms), but never while the person types. Don't render their text as React children; React would clash with the browser's edits.
- Content is only ever set with `textContent`, never `innerHTML`. Links are shared, so the URL is untrusted input; keep it that way.
- View mode turns off `contentEditable`, hides the edit controls, and makes squares buttons (`role="button"`, `aria-pressed`) that toggle marks on click, Enter or Space. Marks live in the URL, so a shared link carries them.
- Celebration settings are part of the card, so everyone with the link plays by the same rules.
- A mark that completes a row, a column, a diagonal (if enabled) or the whole card shows a full-screen `.celebration` overlay, whoever in the room made it (one per completion, queued in `App`). It's styled per theme in `index.css` from the theme colors, with extra effects for some themes, and is removed when its `celebration-fade` animation ends.

## Rooms

Shared real-time play. The server is a separate repo in the sibling folder `../nintendo-direct-bingo-server` (Node + `ws`, on Render's free plan at `wss://nintendo-direct-bingo-server.onrender.com`), and its `CLAUDE.md` holds the protocol, locks, limits and security rules. The URL comes from `VITE_ROOM_SERVER_URL` (`.env.development`: the local server; `.env.production`: Render). Without it the room panel doesn't show.

- **Optional, never a dependency.** The card works offline and solo exactly as without rooms. If the server is down, asleep (Render's free plan takes about a minute to wake), unreachable or drops mid-game, the card keeps working locally, the URL still saves it, and the client keeps retrying. Room code isn't on the startup path: `src/room/session.ts` and everything it imports (`protocol.ts`, `sync.ts`) load with a dynamic `import()` on join. Check `dist/` after changing imports: the main bundle must not include `protocol.ts`, so static code (`remembered.ts`, `RoomPanel`) repeats the few rules it needs.
- **`src/room/protocol.ts` is a copy** of the server's `src/protocol.ts`, kept identical (`diff` them). Change the server's, then copy it. The handshake's `v` catches a mismatch, closing with 4000 ("reload"). Messages from the server are validated as strictly as the server validates clients.
- **`src/room/sync.ts`** (pure, tested): `toRoomCard`/`fromRoomCard` convert, cleaning text the way the server does. The client keeps its own copy of the room's card. `diffCard` turns whatever differs from that copy into operations. Clear and Clear marks are recognized by their result: an emptied card with no marks is one `clear`, and several marks gone at once is one `clear-marks`. Text on a square or title this client doesn't hold the lock for is reverted, not sent.
- **`src/room/session.ts`**: the socket. It joins with the current card, applies server messages as patches through `update`, reconnects with backoff (immediately when the page becomes visible or the network returns), pings every 4 minutes, sends text at most every 150ms, and asks for the lock again before typing after a while. On every (re)join the room's card replaces the local one; offline edits made while disconnected are lost then.
- **`src/hooks/useRoom.ts`** owns the session. It calls `cardChanged` on every card change, and gives squares and the title an `Editing` object (`lockedBy`, `start` on focus, `end` on blur). A square someone else is editing gets `contentEditable=false` and `data-editor` (their name, drawn by `styles/room.css`).
- **Locks are per focus.** Focusing a square or the title asks for its lock, and blurring (deferred a tick, so a change made on blur still goes as this player's) gives it back. Marks and settings don't lock; the server applies them in order and sends them back to everyone, so they converge.
- **Kept outside the card** (`src/room/remembered.ts`): the room in the URL's `room` param, so a copied link invites and a reload rejoins, and the player's name in `localStorage`. View mode, language and name belong to each player.
- **Joining replaces the card**, since a room that already exists keeps its own card. `RoomPanel` asks first when the card has content, unless the room came from an invitation link.
- Text limits (`MAX_TITLE_LENGTH` 80, `MAX_SQUARE_LENGTH` 150 code points, the server's) apply solo too: `fromPayload` cuts long text from links, and typing past the limit is cut, with the caret moved to the end.
