// Screenshot of an element, as a PNG at twice its size so it stays sharp.
// The library is only loaded the first time someone takes a screenshot
export const screenshot = async (element: HTMLElement) => {
  const { domToBlob } = await import("modern-screenshot");
  return domToBlob(element, { scale: 2, type: "image/png" });
};
