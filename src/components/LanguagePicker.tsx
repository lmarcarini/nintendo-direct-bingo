import { LANGUAGES, isLanguage, type Language } from "../i18n/languages";
import { useMessages } from "../i18n/MessagesContext";
import { Icon } from "./ui/Icon";

export function LanguagePicker({
  value,
  onChange,
}: {
  value: Language;
  onChange: (value: Language) => void;
}) {
  const t = useMessages();
  return (
    <label className="language-picker">
      <Icon name="globe" />
      <span className="visually-hidden">{t.language}</span>
      <select
        className="language-select"
        value={value}
        onChange={(e) => {
          const choice = e.currentTarget.value;
          if (isLanguage(choice)) onChange(choice);
        }}
      >
        {LANGUAGES.map((option) => (
          // Each language named in itself, so it's findable from any other
          <option key={option.id} value={option.id} lang={option.id}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
