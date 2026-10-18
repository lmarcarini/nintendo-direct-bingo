import { useEffect, useRef } from "react";
import { clampText, MAX_SQUARE_LENGTH } from "../../card/card";
import { useEditableText } from "../../hooks/useEditableText";
import { useFitText } from "../../hooks/useFitText";
import { useMessages } from "../../i18n/MessagesContext";

const normalizeSquare = (shown: string) => shown.trim().normalize("NFC");

// Editable text while editing; in view mode, a button that toggles its mark.
// In a room, a square someone else is editing (`lockedBy`) is read-only,
// labeled with their name
export function Square({
  index,
  text,
  marked,
  isEditing,
  lockedBy,
  onChange,
  onToggleMark,
  onEditStart,
  onEditEnd,
}: {
  index: number;
  text: string;
  marked: boolean;
  isEditing: boolean;
  lockedBy?: string;
  onChange: (index: number, text: string) => void;
  onToggleMark: (index: number) => void;
  onEditStart: (index: number) => void;
  onEditEnd: (index: number) => void;
}) {
  const t = useMessages();
  const ref = useRef<HTMLDivElement>(null);
  const editable = isEditing && !lockedBy;
  useEditableText(ref, text, normalizeSquare);
  useFitText(ref, text);

  // Someone else got the square first: stop editing it here
  useEffect(() => {
    if (lockedBy && document.activeElement === ref.current) ref.current?.blur();
  }, [lockedBy]);

  return (
    <div
      ref={ref}
      contentEditable={editable ? "plaintext-only" : false}
      onInput={(e) =>
        onChange(
          index,
          clampText(normalizeSquare(e.currentTarget.innerText), MAX_SQUARE_LENGTH)
        )
      }
      onFocus={editable ? () => onEditStart(index) : undefined}
      onBlur={editable ? () => onEditEnd(index) : undefined}
      role={isEditing ? "textbox" : "button"}
      tabIndex={isEditing ? undefined : 0}
      onClick={isEditing ? undefined : () => onToggleMark(index)}
      onKeyDown={
        isEditing
          ? undefined
          : (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onToggleMark(index);
              }
            }
      }
      aria-multiline={isEditing || undefined}
      aria-readonly={(isEditing && !!lockedBy) || undefined}
      aria-pressed={isEditing ? undefined : marked}
      aria-label={isEditing || !text ? t.square(index + 1) : undefined}
      title={isEditing && lockedBy ? t.editing(lockedBy) : undefined}
      data-editor={isEditing ? lockedBy : undefined}
      className={`bingo-input${marked ? " bingo-input--marked" : ""}`}
      spellCheck="false"
    ></div>
  );
}
