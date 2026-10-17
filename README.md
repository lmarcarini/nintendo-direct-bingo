# Nintendo Direct Bingo

A small web app for making bingo cards before a Nintendo Direct. Fill the squares with your predictions, share the link with friends, and see who calls it during the show.

## How it works

1. Open the app and pick a 4×4 (16) or 5×5 (25) card.
2. Click any square and type your prediction. Text shrinks to fit the square.
3. Press **View** to lock the card, then copy the URL and send it to your friends.

The URL holds the whole card. Nothing is stored on a server, so whoever has the link has the card.

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

- [ ] **Themes**: pick a color scheme for your card
- [ ] **Editable title**: replace "Nintendo Direct Bingo" with your own title
- [ ] **Better URL saving**: shorter share links (emoji and other characters already work)
- [ ] **Mark matches**: click squares in view mode to mark what got announced
- [ ] **Rooms**: a shared room over WebSockets so friends can play together live
