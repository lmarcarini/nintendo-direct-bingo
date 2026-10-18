import { useEffect, useRef } from "react";
import { clampText, DEFAULT_TITLE, MAX_TITLE_LENGTH } from "../../card/card";
import { useEditableText } from "../../hooks/useEditableText";
import { useMessages } from "../../i18n/MessagesContext";

// One line: whitespace (pasted newlines too) collapses to single spaces
const normalizeTitle = (shown: string) =>
  shown.replace(/\s+/g, " ").trim().normalize("NFC");

export function CardTitle({
  title,
  isEditing,
  lockedBy,
  onChange,
  onEditStart,
  onEditEnd,
}: {
  title: string;
  isEditing: boolean;
  lockedBy?: string;
  onChange: (title: string) => void;
  onEditStart: () => void;
  onEditEnd: () => void;
}) {
  const t = useMessages();
  const ref = useRef<HTMLHeadingElement>(null);
  const editable = isEditing && !lockedBy;
  useEditableText(ref, title, normalizeTitle);

  useEffect(() => {
    if (lockedBy && document.activeElement === ref.current) ref.current?.blur();
  }, [lockedBy]);

  return (
    <h1
      ref={ref}
      contentEditable={editable ? "plaintext-only" : false}
      onInput={(e) =>
        onChange(clampText(normalizeTitle(e.currentTarget.innerText), MAX_TITLE_LENGTH))
      }
      onFocus={editable ? onEditStart : undefined}
      // An emptied title goes back to the default
      onBlur={
        editable
          ? () => {
              if (!title) onChange(DEFAULT_TITLE);
              onEditEnd();
            }
          : undefined
      }
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          e.currentTarget.blur();
        }
      }}
      aria-label={isEditing ? t.cardTitle : undefined}
      aria-readonly={(isEditing && !!lockedBy) || undefined}
      title={isEditing && lockedBy ? t.editing(lockedBy) : undefined}
      data-editor={isEditing ? lockedBy : undefined}
      className="bingo-title"
      spellCheck="false"
    ></h1>
  );
}
