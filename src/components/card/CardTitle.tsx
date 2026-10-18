import { useRef } from "react";
import { DEFAULT_TITLE } from "../../card/card";
import { useEditableText } from "../../hooks/useEditableText";
import { useMessages } from "../../i18n/MessagesContext";

// One line: whitespace (pasted newlines too) collapses to single spaces
const normalizeTitle = (shown: string) => shown.replace(/\s+/g, " ").trim();

export function CardTitle({
  title,
  isEditing,
  onChange,
}: {
  title: string;
  isEditing: boolean;
  onChange: (title: string) => void;
}) {
  const t = useMessages();
  const ref = useRef<HTMLHeadingElement>(null);
  useEditableText(ref, title, normalizeTitle);

  return (
    <h1
      ref={ref}
      contentEditable={isEditing ? "plaintext-only" : false}
      onInput={(e) => onChange(normalizeTitle(e.currentTarget.innerText))}
      // An emptied title goes back to the default
      onBlur={() => {
        if (!title) onChange(DEFAULT_TITLE);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          e.currentTarget.blur();
        }
      }}
      aria-label={isEditing ? t.cardTitle : undefined}
      className="bingo-title"
      spellCheck="false"
    ></h1>
  );
}
