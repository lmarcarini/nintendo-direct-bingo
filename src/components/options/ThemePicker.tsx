import { THEMES, type Theme } from "../../card/themes";
import { useMessages } from "../../i18n/MessagesContext";

export function ThemePicker({
  value,
  onChange,
}: {
  value: Theme;
  onChange: (value: Theme) => void;
}) {
  const t = useMessages();
  return (
    <fieldset className="options-group">
      <legend>{t.theme}</legend>
      <div className="theme-picker">
        {THEMES.map((theme) => (
          // data-theme gives the chip that theme's colors
          <label
            key={theme.id}
            data-theme={theme.id}
            className="option-choice theme-chip"
          >
            <input
              type="radio"
              name="theme"
              className="option-radio"
              checked={value === theme.id}
              onChange={() => onChange(theme.id)}
            />
            <span className="theme-chip-swatch" aria-hidden="true">
              <span></span>
              <span></span>
            </span>
            {theme.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
