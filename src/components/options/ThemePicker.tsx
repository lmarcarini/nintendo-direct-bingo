import { useRef } from "react";
import { THEMES, type Theme } from "../../card/themes";
import { useMessages } from "../../i18n/MessagesContext";
import { Icon } from "../ui/Icon";

// How many themes show in the options; the rest are in the "All themes"
// dialog. The chosen theme always takes the last spot if it's not among them
const SHOWN_THEMES = 5;

const shownThemes = (value: Theme) => {
  const first = THEMES.slice(0, SHOWN_THEMES);
  if (first.some((theme) => theme.id === value)) return first;
  const chosen = THEMES.filter((theme) => theme.id === value);
  return [...first.slice(0, SHOWN_THEMES - 1), ...chosen];
};

export function ThemePicker({
  value,
  onChange,
}: {
  value: Theme;
  onChange: (value: Theme) => void;
}) {
  const t = useMessages();
  const dialog = useRef<HTMLDialogElement>(null);
  return (
    <fieldset className="options-group">
      <legend>{t.theme}</legend>
      <div className="theme-picker">
        {shownThemes(value).map((theme) => (
          <ThemeChip
            key={theme.id}
            theme={theme}
            name="theme"
            checked={value === theme.id}
            onChange={() => onChange(theme.id)}
          />
        ))}
        <button
          type="button"
          className="option-choice theme-chip theme-chip--all"
          onClick={() => dialog.current?.showModal()}
        >
          <Icon name="grid" />
          {t.allThemes(THEMES.length)}
        </button>
      </div>
      <dialog
        ref={dialog}
        className="theme-dialog"
        aria-labelledby="theme-dialog-title"
      >
        <div className="theme-dialog-header">
          <h2 id="theme-dialog-title">{t.themes}</h2>
          <button
            type="button"
            className="theme-dialog-close"
            aria-label={t.close}
            onClick={() => dialog.current?.close()}
          >
            <Icon name="close" />
          </button>
        </div>
        <div className="theme-picker theme-picker--all">
          {THEMES.map((theme) => (
            <ThemeChip
              key={theme.id}
              theme={theme}
              name="theme-all"
              checked={value === theme.id}
              onChange={() => {
                onChange(theme.id);
                dialog.current?.close();
              }}
            />
          ))}
        </div>
      </dialog>
    </fieldset>
  );
}

function ThemeChip({
  theme,
  name,
  checked,
  onChange,
}: {
  theme: (typeof THEMES)[number];
  name: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    // data-theme gives the chip that theme's colors
    <label data-theme={theme.id} className="option-choice theme-chip">
      <input
        type="radio"
        name={name}
        className="option-radio"
        checked={checked}
        onChange={onChange}
      />
      <span className="theme-chip-swatch" aria-hidden="true">
        <span></span>
        <span></span>
      </span>
      {theme.label}
    </label>
  );
}
