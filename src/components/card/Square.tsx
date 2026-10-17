import { useRef } from "react";
import { useEditableText } from "../../hooks/useEditableText";
import { useFitText } from "../../hooks/useFitText";
import { useMessages } from "../../i18n/MessagesContext";

const normalizeSquare = (shown: string) => shown.trim();

// Editable text while editing; in view mode, a button that toggles its mark
export function Square({
  index,
  text,
  marked,
  isEditing,
  onChange,
  onToggleMark,
}: {
  index: number;
  text: string;
  marked: boolean;
  isEditing: boolean;
  onChange: (index: number, text: string) => void;
  onToggleMark: (index: number) => void;
}) {
  const t = useMessages();
  const ref = useRef<HTMLDivElement>(null);
  useEditableText(ref, text, normalizeSquare);
  useFitText(ref, text);

  return (
    <div
      ref={ref}
      contentEditable={isEditing ? "plaintext-only" : false}
      onInput={(e) => onChange(index, normalizeSquare(e.currentTarget.innerText))}
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
      aria-pressed={isEditing ? undefined : marked}
      aria-label={isEditing || !text ? t.square(index + 1) : undefined}
      className={`bingo-input${marked ? " bingo-input--marked" : ""}`}
      spellCheck="false"
    ></div>
  );
}
