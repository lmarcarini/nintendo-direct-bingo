// deflate-raw through the browser's built-in compression streams

export const compress = async (text: string) => {
  const stream = new Blob([text])
    .stream()
    .pipeThrough(new CompressionStream("deflate-raw"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
};

// Throws past `maxBytes`, so crafted input can't expand into a huge string
export const decompress = async (
  bytes: Uint8Array<ArrayBuffer>,
  maxBytes: number
) => {
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
    if (size > maxBytes) {
      await reader.cancel();
      throw new Error("Decompressed data is too large");
    }
    chunks.push(value);
  }
  return new Blob(chunks).text();
};
