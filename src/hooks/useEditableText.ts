import { useLayoutEffect, type RefObject } from "react";

// Editable elements are uncontrolled: the browser owns their text and React
// never renders it (it would clash with the browser's edits). This writes
// `text` in only when it differs from what the element shows, after
// `normalize`: on mount, when the card is cleared, and (later) when another
// player edits it. While the person types the two match, so the caret stays.
// Always with textContent: the text comes from links and is untrusted
export const useEditableText = (
  ref: RefObject<HTMLElement | null>,
  text: string,
  normalize: (shown: string) => string
) => {
  useLayoutEffect(() => {
    const element = ref.current;
    if (element && normalize(element.innerText) !== text)
      element.textContent = text;
  }, [ref, text, normalize]);
};
