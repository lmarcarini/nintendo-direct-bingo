const MAX_FONT_SIZE = 36;
const MIN_FONT_SIZE = 8;
const PRECISION = 0.5;

// Relies on the square overflowing only downwards and to the right
// (`justify-content: safe center`), so scroll sizes measure all the text.
const fits = (element: HTMLElement) =>
  element.scrollHeight <= element.clientHeight &&
  element.scrollWidth <= element.clientWidth;

const setSize = (element: HTMLElement, size: number) => {
  element.style.fontSize = `${size}px`;
};

// Largest size that fits; MIN_FONT_SIZE if nothing does
const fitFontSize = (element: HTMLElement) => {
  setSize(element, MAX_FONT_SIZE);
  if (fits(element)) return MAX_FONT_SIZE;

  // Binary search: `low` always fits (or is the floor), `high` never does
  let low = MIN_FONT_SIZE;
  let high = MAX_FONT_SIZE;
  while (high - low > PRECISION) {
    const mid = (low + high) / 2;
    setSize(element, mid);
    if (fits(element)) low = mid;
    else high = mid;
  }
  setSize(element, low);
  return low;
};

// Sets the largest font size at which the text fits the square.
// Words are only broken when a word is too long even at MIN_FONT_SIZE;
// text that still doesn't fit is clipped at the bottom.
export const adjustFontSize = (element: HTMLElement) => {
  element.style.overflowWrap = "";
  if (fitFontSize(element) > MIN_FONT_SIZE || fits(element)) return;

  element.style.overflowWrap = "anywhere";
  fitFontSize(element);
};
