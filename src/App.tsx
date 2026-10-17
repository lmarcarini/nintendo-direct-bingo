import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { THEMES, type Theme } from "./themes";
import { adjustFontSize } from "./utils/adjustFontSize";
import {
  DEFAULT_TITLE,
  MAX_SQUARES,
  isMarked,
  writeCard,
  type Card,
} from "./utils/cardUrl";

// Editable elements already filled with their saved text, so re-renders
// don't reset them (React doesn't own their content, the browser does)
const filled = new WeakSet<HTMLElement>();
const fillOnce = (element: HTMLElement | null, text: string) => {
  if (element && !filled.has(element)) {
    filled.add(element);
    element.textContent = text;
  }
};

function App({ initialCard }: { initialCard: Card }) {
  const [card, setCard] = useState(initialCard);
  const bingoRefs = useRef<(HTMLDivElement | null)[]>([]);
  const isEditing = card.view === "edit";

  const update = (patch: Partial<Card>) =>
    setCard((current) => ({ ...current, ...patch }));

  useEffect(() => {
    writeCard(card);
  }, [card]);

  // Layout effect so the page never paints in the default theme first
  useLayoutEffect(() => {
    document.documentElement.dataset.theme = card.theme;
  }, [card.theme]);

  useEffect(() => {
    document.title = card.title || DEFAULT_TITLE;
  }, [card.title]);

  useEffect(() => {
    const squares = bingoRefs.current
      .slice(0, card.nItems)
      .filter((ref): ref is HTMLDivElement => ref != null);

    // Fires once on observe, then whenever the squares resize
    const resizeObserver = new ResizeObserver(() =>
      squares.forEach(adjustFontSize)
    );
    squares.forEach((square) => resizeObserver.observe(square));

    return () => resizeObserver.disconnect();
  }, [card.nItems]); // Re-run so newly shown squares are observed

  const onSquareInput = (index: number, square: HTMLDivElement) => {
    const text = square.innerText.trim();
    setCard((current) => ({
      ...current,
      values: current.values.map((value, i) => (i === index ? text : value)),
    }));
    adjustFontSize(square);
  };

  const onTitleInput = (e: React.FormEvent<HTMLHeadingElement>) => {
    update({ title: e.currentTarget.innerText.replace(/\s+/g, " ").trim() });
  };

  const onTitleBlur = (e: React.FocusEvent<HTMLHeadingElement>) => {
    if (e.currentTarget.innerText.trim()) return;
    e.currentTarget.textContent = DEFAULT_TITLE;
    update({ title: DEFAULT_TITLE });
  };

  const onTitleKeyDown = (e: React.KeyboardEvent<HTMLHeadingElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      e.currentTarget.blur();
    }
  };

  const toggleMark = (index: number) =>
    setCard((current) => ({ ...current, marks: current.marks ^ (1 << index) }));

  const onSquareKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLDivElement>
  ) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggleMark(index);
    }
  };

  const onToggleView = () => update({ view: isEditing ? "preview" : "edit" });

  const onClear = () => {
    // The URL is the only copy of the card, so there is no undo
    if (
      (card.values.some(Boolean) || card.marks) &&
      !window.confirm("Clear every square on the card?")
    )
      return;
    bingoRefs.current.forEach((ref) => {
      if (ref) {
        ref.textContent = "";
        adjustFontSize(ref);
      }
    });
    update({ values: Array<string>(MAX_SQUARES).fill(""), marks: 0 });
  };

  const onClearMarks = () => {
    if (window.confirm("Unmark every square?")) update({ marks: 0 });
  };

  return (
    <div className="content-wrapper">
      <div className="bingo-card">
        <h1
          ref={(el) => fillOnce(el, card.title)}
          contentEditable={isEditing ? "plaintext-only" : false}
          onInput={onTitleInput}
          onBlur={onTitleBlur}
          onKeyDown={onTitleKeyDown}
          aria-label={isEditing ? "Card title" : undefined}
          className="bingo-title"
          spellCheck="false"
        ></h1>
        <div className={`bingo-wrapper bingo-wrapper--${card.nItems}-items`}>
          {Array.from({ length: card.nItems }, (_, index) => {
            const marked = isMarked(card.marks, index);
            return (
              <div
                ref={(el) => {
                  bingoRefs.current[index] = el;
                  fillOnce(el, card.values[index]);
                }}
                key={index}
                contentEditable={isEditing ? "plaintext-only" : false}
                onInput={(e) => onSquareInput(index, e.currentTarget)}
                // In view mode squares are buttons that toggle a mark
                role={isEditing ? "textbox" : "button"}
                tabIndex={isEditing ? undefined : 0}
                onClick={isEditing ? undefined : () => toggleMark(index)}
                onKeyDown={
                  isEditing ? undefined : (e) => onSquareKeyDown(index, e)
                }
                aria-multiline={isEditing || undefined}
                aria-pressed={isEditing ? undefined : marked}
                aria-label={
                  isEditing || !card.values[index]
                    ? `Square ${index + 1}`
                    : undefined
                }
                className={`bingo-input${marked ? " bingo-input--marked" : ""}`}
                spellCheck="false"
              ></div>
            );
          })}
        </div>
      </div>
      <div className="button-wrapper">
        {!isEditing && card.marks !== 0 && (
          <button
            type="button"
            onClick={onClearMarks}
            className="button button-secondary"
          >
            Clear marks
          </button>
        )}
        <button
          type="button"
          onClick={onToggleView}
          className="button button-primary"
        >
          {isEditing ? "View" : "Edit"}
        </button>
        {isEditing && (
          <button
            type="button"
            onClick={onClear}
            className="button button-secondary"
          >
            Clear
          </button>
        )}
      </div>
      <fieldset className="options-fieldset" hidden={!isEditing}>
        <legend>Card options</legend>
        <label>
          Squares{" "}
          <select
            value={card.nItems}
            onChange={(e) =>
              update({ nItems: e.currentTarget.value === "25" ? 25 : 16 })
            }
          >
            <option value={16}>16</option>
            <option value={25}>25</option>
          </select>
        </label>
        <label>
          Theme{" "}
          <select
            value={card.theme}
            onChange={(e) =>
              update({ theme: e.currentTarget.value as Theme })
            }
          >
            {THEMES.map((theme) => (
              <option key={theme.id} value={theme.id}>
                {theme.label}
              </option>
            ))}
          </select>
        </label>
      </fieldset>
    </div>
  );
}

export default App;
