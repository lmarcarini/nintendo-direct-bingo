import { useEffect, useLayoutEffect, type RefObject } from "react";
import { adjustFontSize } from "../lib/adjustFontSize";

// Keeps the element's text at the largest size that fits: when the text
// changes, and whenever the element resizes
export const useFitText = (
  ref: RefObject<HTMLElement | null>,
  text: string
) => {
  useLayoutEffect(() => {
    if (ref.current) adjustFontSize(ref.current);
  }, [ref, text]);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new ResizeObserver(() => adjustFontSize(element));
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);
};
