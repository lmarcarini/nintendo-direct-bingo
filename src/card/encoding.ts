import { fromBase64Url, toBase64Url } from "../lib/base64url";
import { compress, decompress } from "../lib/deflate";
import type { Card } from "./card";
import { fromPayload, toPayload } from "./payload";

// The card as one string: the payload JSON, deflate-raw compressed, then
// base64url. It's the URL's `c` param, and the format rooms will sync.
// A default card encodes to "".

const MAX_JSON_BYTES = 100_000;

export const encodeCard = async (card: Card): Promise<string> => {
  const payload = toPayload(card);
  if (!Object.keys(payload).length) return "";
  return toBase64Url(await compress(JSON.stringify(payload)));
};

// Never throws: anything that doesn't decode is a default card
export const decodeCard = async (encoded: string): Promise<Card> => {
  if (!encoded) return fromPayload({});
  try {
    const json = await decompress(fromBase64Url(encoded), MAX_JSON_BYTES);
    return fromPayload(JSON.parse(json));
  } catch {
    return fromPayload({});
  }
};
