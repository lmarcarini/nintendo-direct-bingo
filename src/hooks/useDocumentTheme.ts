import { useLayoutEffect } from "react";
import type { Theme } from "../card/themes";

// On <html> so the whole page takes the theme's colors. A layout effect so
// the page never paints in the default theme first
export const useDocumentTheme = (theme: Theme) => {
  useLayoutEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);
};
