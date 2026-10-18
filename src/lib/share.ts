// The Web Share API (mostly mobile share sheets)
export const canShare = typeof navigator.share === "function";

// Shares the link and, where the device supports sharing files, the
// screenshot too
export const share = async (title: string, image: Promise<Blob>) => {
  const url = window.location.href;
  const file = new File([await image], "bingo.png", { type: "image/png" });
  const data: ShareData = navigator.canShare?.({ files: [file] })
    ? { title, url, files: [file] }
    : { title, url };
  await navigator.share(data);
};
