import { useLayoutEffect, type RefObject } from "react";

// Editable elements are uncontrolled: the browser owns their text and React
// never renders it (it would clash with the browser's edits). This writes
// `text` in only when it differs from what the element shows, after
// `normalize`: on mount, when the card is cleared, when another player in
// the room edits it, or when typing goes over the length limit. While the
// person types the two match, so the caret stays; if the element is focused
// when its text is replaced, the caret goes to the end.
// Always with textContent: the text comes from links and is untrusted
export const useEditableText = (
  ref: RefObject<HTMLElement | null>,
  text: string,
  normalize: (shown: string) => string
) => {
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element || normalize(element.innerText) === text) return;
    element.textContent = text;
    if (document.activeElement === element) {
      const selection = window.getSelection();
      selection?.selectAllChildren(element);
      selection?.collapseToEnd();
    }
  }, [ref, text, normalize]);
};
