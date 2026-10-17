// Card state lives in the URL query string:
//   0..24   square text, UTF-8 encoded as base64url
//   nItems  16 | 25
//   view    edit | preview

export const MAX_SQUARES = 25;

export type View = "edit" | "preview";

export type Card = {
  values: string[];
  nItems: number;
  view: View;
};

const encodeText = (text: string) => {
  let binary = "";
  new TextEncoder().encode(text).forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
};

const decodeBinary = (encoded: string) =>
  atob(encoded.replace(/-/g, "+").replace(/_/g, "/"));

const decodeText = (encoded: string) => {
  const bytes = Uint8Array.from(decodeBinary(encoded), (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
};

export const readCard = (url: URL): Card => {
  const params = url.searchParams;

  const values = Array.from({ length: MAX_SQUARES }, (_, i) => {
    const encoded = params.get(i.toString());
    if (!encoded) return "";
    try {
      return decodeText(encoded);
    } catch {
      return "";
    }
  });

  return {
    values,
    nItems: params.get("nItems") === "25" ? 25 : 16,
    view: params.get("view") === "preview" ? "preview" : "edit",
  };
};

export const setSquare = (
  params: URLSearchParams,
  index: number,
  text: string
) => {
  if (text) params.set(index.toString(), encodeText(text));
  else params.delete(index.toString());
};

// replaceState so the back button doesn't step through every keystroke
export const updateUrl = (update: (params: URLSearchParams) => void) => {
  const url = new URL(window.location.href);
  update(url.searchParams);
  window.history.replaceState(null, "", url);
};
