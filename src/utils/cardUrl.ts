import { DEFAULT_THEME, isTheme, type Theme } from "../themes";

// The whole card lives in one query param, `c`: the card as JSON
// (short keys, defaults omitted), deflate-raw compressed, then base64url.

export const MAX_SQUARES = 25;
export const DEFAULT_TITLE = "Nintendo Direct Bingo";

const PARAM = "c";
// Decompressed size limit, so a crafted link can't expand into a huge string
const MAX_JSON_BYTES = 100_000;

export type View = "edit" | "preview";
export type SquareCount = 16 | 25;

export type Card = {
  title: string;
  values: string[]; // always MAX_SQUARES long, including hidden squares
  nItems: SquareCount;
  view: View;
  theme: Theme;
  marks: number; // bit i set = square i marked as a hit
};

type Payload = {
  t?: string; // title
  s?: string[]; // square text, trailing empty squares dropped
  n?: number; // nItems
  v?: "p"; // preview
  th?: string; // theme
  m?: number; // marks
};

export const isMarked = (marks: number, index: number) =>
  ((marks >> index) & 1) === 1;

const toPayload = (card: Card): Payload => {
  const payload: Payload = {};
  let end = card.values.length;
  while (end > 0 && !card.values[end - 1]) end--;
  if (end > 0) payload.s = card.values.slice(0, end);
  if (card.title && card.title !== DEFAULT_TITLE) payload.t = card.title;
  if (card.nItems !== 16) payload.n = card.nItems;
  if (card.view === "preview") payload.v = "p";
  if (card.theme !== DEFAULT_THEME) payload.th = card.theme;
  if (card.marks) payload.m = card.marks;
  return payload;
};

// The URL is untrusted, so every field is checked
const fromPayload = (data: unknown): Card => {
  const payload: Payload =
    typeof data === "object" && data !== null ? (data as Payload) : {};
  const squares = Array.isArray(payload.s) ? payload.s : [];
  return {
    title:
      typeof payload.t === "string" && payload.t ? payload.t : DEFAULT_TITLE,
    values: Array.from({ length: MAX_SQUARES }, (_, i) =>
      typeof squares[i] === "string" ? squares[i] : ""
    ),
    nItems: payload.n === 25 ? 25 : 16,
    view: payload.v === "p" ? "preview" : "edit",
    theme: isTheme(payload.th) ? payload.th : DEFAULT_THEME,
    marks: Number.isInteger(payload.m)
      ? (payload.m as number) & ((1 << MAX_SQUARES) - 1)
      : 0,
  };
};

const toBase64Url = (bytes: Uint8Array) => {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
};

const fromBase64Url = (encoded: string) =>
  Uint8Array.from(atob(encoded.replace(/-/g, "+").replace(/_/g, "/")), (c) =>
    c.charCodeAt(0)
  );

const compress = async (text: string) => {
  const stream = new Blob([text])
    .stream()
    .pipeThrough(new CompressionStream("deflate-raw"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
};

const decompress = async (bytes: Uint8Array<ArrayBuffer>) => {
  const reader = new Blob([bytes])
    .stream()
    .pipeThrough(new DecompressionStream("deflate-raw"))
    .getReader();
  const chunks: Uint8Array<ArrayBuffer>[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > MAX_JSON_BYTES) {
      await reader.cancel();
      throw new Error("Card is too large");
    }
    chunks.push(value);
  }
  return new Blob(chunks).text();
};

export const readCard = async (url: URL): Promise<Card> => {
  const encoded = url.searchParams.get(PARAM);
  if (!encoded) return fromPayload({});
  try {
    return fromPayload(JSON.parse(await decompress(fromBase64Url(encoded))));
  } catch {
    return fromPayload({});
  }
};

// Compression is async, so a slow write must not overwrite a newer one
let latestWrite = 0;

// replaceState so the back button doesn't step through every keystroke
export const writeCard = async (card: Card) => {
  const write = ++latestWrite;
  const payload = toPayload(card);
  const encoded = Object.keys(payload).length
    ? toBase64Url(await compress(JSON.stringify(payload)))
    : "";
  if (write !== latestWrite) return;

  const url = new URL(window.location.href);
  url.search = encoded ? `?${PARAM}=${encoded}` : "";
  window.history.replaceState(null, "", url);
};
