import {
  DEFAULT_LANGUAGE,
  LANGUAGES,
  isLanguage,
  type Language,
} from "./languages";

// The language belongs to the viewer, not the card: it's saved in this
// browser only when they pick one, and detected otherwise

const STORAGE_KEY = "language";

// Location first (the time zone), then the browser's preferred languages
const detectLanguage = (): Language => {
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const local = LANGUAGES.find((language) =>
    (language.timeZones as readonly string[]).includes(timeZone)
  );
  if (local) return local.id;

  for (const tag of navigator.languages) {
    const primary = tag.split("-")[0].toLowerCase();
    const match = LANGUAGES.find((language) =>
      (language.browserLanguages as readonly string[]).includes(primary)
    );
    if (match) return match.id;
  }
  return DEFAULT_LANGUAGE;
};

// Storage can be unavailable (private windows, blocked site data)
export const readLanguage = (): Language => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (isLanguage(saved)) return saved;
  } catch {
    // Fall through to detection
  }
  return detectLanguage();
};

export const saveLanguage = (language: Language) => {
  try {
    localStorage.setItem(STORAGE_KEY, language);
  } catch {
    // Not saved; the choice still applies until the page is closed
  }
};
