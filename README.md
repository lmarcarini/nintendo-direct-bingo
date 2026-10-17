# Nintendo Direct Bingo

A small web app for making bingo cards before a Nintendo Direct. Fill the squares with your predictions, share the link with friends, and see who calls it during the show.

## How it works

1. Open the app and pick a 4×4 (16) or 5×5 (25) card and a color theme.
2. Click the title to rename the card, and click any square to type a prediction. Text shrinks to fit the square.
3. Press **View** to lock the card, then copy the URL and send it to your friends.
4. During the Direct, click (or tap) squares in view mode to mark what got announced.

The URL holds the whole card, including the title, theme and marks. Nothing is stored on a server, so whoever has the link has the card.

## Running locally

Uses the Node version in `.nvmrc` (24 LTS).

```bash
nvm use
npm install
npm run dev       # start the dev server
npm run build     # type-check and build to dist/
npm run preview   # serve the production build
npm run lint      # run ESLint
```

## Tech

React 19, TypeScript, Vite 8. No backend.

## Roadmap

- [x] **Themes**: pick a color scheme for your card
- [x] **Editable title**: replace "Nintendo Direct Bingo" with your own title
- [x] **Better URL saving**: the whole card is compressed into one shorter link
- [x] **Mark matches**: click squares in view mode to mark what got announced
- [ ] **Rooms**: a shared room over WebSockets so friends can play together live
