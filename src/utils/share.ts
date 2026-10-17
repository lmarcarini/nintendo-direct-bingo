// Screenshot of the card, as a PNG at twice its size so it stays sharp.
// The library is only loaded the first time someone takes a screenshot
export const cardImage = async (card: HTMLElement) => {
  const { domToBlob } = await import("modern-screenshot");
  return domToBlob(card, { scale: 2, type: "image/png" });
};

// Takes a promise so the clipboard write starts during the click: Safari
// refuses it if it only begins once the screenshot is done
export const copyImage = (image: Promise<Blob>) =>
  navigator.clipboard.write([new ClipboardItem({ "image/png": image })]);

export const copyLink = () =>
  navigator.clipboard.writeText(window.location.href);

export const canShare = typeof navigator.share === "function";

// Shares the link and, where the device supports sharing files, the
// screenshot too (mobile share sheets mostly)
export const share = async (title: string, image: Promise<Blob>) => {
  const url = window.location.href;
  const file = new File([await image], "bingo.png", { type: "image/png" });
  const data: ShareData = navigator.canShare?.({ files: [file] })
    ? { title, url, files: [file] }
    : { title, url };
  await navigator.share(data);
};
