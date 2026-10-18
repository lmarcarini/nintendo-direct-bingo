import {
  clampText,
  DEFAULT_CARD,
  MAX_SQUARE_LENGTH,
  MAX_SQUARES,
  MAX_TITLE_LENGTH,
  type Card,
} from "./card";
import { isMarker } from "./markers";
import { isTheme } from "./themes";

// The card as plain JSON: short keys, fields at their default left out
export type Payload = {
  t?: string; // title
  s?: string[]; // square text, trailing empty squares dropped
  n?: number; // nItems
  v?: "p"; // preview
  th?: string; // theme
  m?: number; // marks
  mk?: string; // marker
  a?: 0; // animations off
  dg?: 1; // diagonals
  el?: 1; // every line
};

export const toPayload = (card: Card): Payload => {
  const payload: Payload = {};
  let end = card.values.length;
  while (end > 0 && !card.values[end - 1]) end--;
  if (end > 0) payload.s = card.values.slice(0, end);
  if (card.title && card.title !== DEFAULT_CARD.title) payload.t = card.title;
  if (card.nItems !== DEFAULT_CARD.nItems) payload.n = card.nItems;
  if (card.view === "preview") payload.v = "p";
  if (card.theme !== DEFAULT_CARD.theme) payload.th = card.theme;
  if (card.marks) payload.m = card.marks;
  if (card.marker !== DEFAULT_CARD.marker) payload.mk = card.marker;
  if (!card.animations) payload.a = 0;
  if (card.diagonals) payload.dg = 1;
  if (card.everyLine) payload.el = 1;
  return payload;
};

// Payloads come from links and from the room server, so every field is
// checked: anything invalid falls back to its default, and text over the
// limits is cut
export const fromPayload = (data: unknown): Card => {
  const payload: Payload =
    typeof data === "object" && data !== null ? (data as Payload) : {};
  const squares = Array.isArray(payload.s) ? payload.s : [];
  return {
    title:
      typeof payload.t === "string" && payload.t
        ? clampText(payload.t, MAX_TITLE_LENGTH)
        : DEFAULT_CARD.title,
    values: Array.from({ length: MAX_SQUARES }, (_, i) =>
      typeof squares[i] === "string"
        ? clampText(squares[i], MAX_SQUARE_LENGTH)
        : ""
    ),
    nItems: payload.n === 25 ? 25 : DEFAULT_CARD.nItems,
    view: payload.v === "p" ? "preview" : DEFAULT_CARD.view,
    theme: isTheme(payload.th) ? payload.th : DEFAULT_CARD.theme,
    marks: Number.isInteger(payload.m)
      ? (payload.m as number) & ((1 << MAX_SQUARES) - 1)
      : DEFAULT_CARD.marks,
    marker: isMarker(payload.mk) ? payload.mk : DEFAULT_CARD.marker,
    animations: payload.a !== 0,
    diagonals: payload.dg === 1,
    everyLine: payload.el === 1,
  };
};
