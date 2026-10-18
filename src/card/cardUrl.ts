import type { Card } from "./card";
import { decodeCard, encodeCard } from "./encoding";

// The URL is the only place a card is saved: the encoded card in `c`
const PARAM = "c";

export const readCard = (url: URL): Promise<Card> =>
  decodeCard(url.searchParams.get(PARAM) ?? "");

// Encoding is async, so a slow write must not overwrite a newer one
let latestWrite = 0;

// replaceState so the back button doesn't step through every keystroke
export const writeCard = async (card: Card) => {
  const write = ++latestWrite;
  const encoded = await encodeCard(card);
  if (write !== latestWrite) return;

  // Other params (the room) stay
  const url = new URL(window.location.href);
  if (encoded) url.searchParams.set(PARAM, encoded);
  else url.searchParams.delete(PARAM);
  window.history.replaceState(null, "", url);
};
