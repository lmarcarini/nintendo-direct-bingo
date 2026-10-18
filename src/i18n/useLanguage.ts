import { useLayoutEffect, useState } from "react";
import type { Language } from "./languages";
import { readLanguage, saveLanguage } from "./preference";

// The viewer's language, kept on <html lang>. Choosing one saves it
export const useLanguage = () => {
  const [language, setLanguage] = useState(readLanguage);

  useLayoutEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const chooseLanguage = (choice: Language) => {
    setLanguage(choice);
    saveLanguage(choice);
  };

  return [language, chooseLanguage] as const;
};
