import { useEffect, useRef, useState } from "react";
import { adjustFontSize } from "./utils/adjustFontSize";
import {
  MAX_SQUARES,
  readCard,
  setSquare,
  updateUrl,
  type View,
} from "./utils/cardUrl";

const initialCard = readCard(new URL(window.location.href));

// Squares already filled with their saved text, so re-renders don't reset them
const filledSquares = new WeakSet<HTMLDivElement>();

function App() {
  const [viewState, setView] = useState<View>(initialCard.view);
  const [nInputs, setNInputs] = useState(initialCard.nItems);
  // Current text of every square, including ones hidden when showing 16
  const values = useRef(initialCard.values);
  const bingoRefs = useRef<(HTMLDivElement | null)[]>([]);

  const onChangeNInputs = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const curNInputs = e.currentTarget.value;
    setNInputs(+curNInputs);
    updateUrl((params) => params.set("nItems", curNInputs));
  };

  const onChangeItem = (e: React.FormEvent<HTMLDivElement>) => {
    const square = e.currentTarget;
    const index = Number(square.dataset.name);
    const text = square.innerText.trim();
    values.current[index] = text;
    updateUrl((params) => setSquare(params, index, text));
    adjustFontSize(square);
  };

  const onToogleView = () => {
    const newViewState = viewState === "edit" ? "preview" : "edit";
    setView(newViewState);
    updateUrl((params) => params.set("view", newViewState));
  };

  useEffect(() => {
    const squares = bingoRefs.current
      .slice(0, nInputs)
      .filter((ref): ref is HTMLDivElement => ref != null);
    const adjustAllFontSizes = () => squares.forEach(adjustFontSize);

    // Run immediately after DOM is painted
    adjustAllFontSizes();

    // Also adjust when the squares resize
    const resizeObserver = new ResizeObserver(adjustAllFontSizes);
    squares.forEach((square) => resizeObserver.observe(square));

    return () => resizeObserver.disconnect();
  }, [nInputs]); // Re-run so newly shown squares are observed

  const onClear = () => {
    values.current.fill("");
    bingoRefs.current.forEach((ref) => {
      if (ref) {
        ref.textContent = "";
        adjustFontSize(ref);
      }
    });
    updateUrl((params) => {
      for (let i = 0; i < MAX_SQUARES; i++) setSquare(params, i, "");
    });
  };

  return (
    <div className="content-wrapper">
      <div className="bingo-card">
        <h1>Nintendo Direct Bingo</h1>
        <div className={`bingo-wrapper bingo-wrapper--${nInputs}-items`}>
          {Array.from({ length: nInputs }, (_, index) => (
            <div
              ref={(el) => {
                bingoRefs.current[index] = el;
                if (el && !filledSquares.has(el)) {
                  filledSquares.add(el);
                  el.textContent = values.current[index];
                }
              }}
              onInput={onChangeItem}
              key={index}
              data-name={index}
              contentEditable={viewState == "edit" ? "plaintext-only" : false}
              className="bingo-input"
              spellCheck="false"
            ></div>
          ))}
        </div>
      </div>
      <div className="button-wrapper">
        {viewState == "edit" && (
          <>
            {" "}
            <button
              type="button"
              onClick={onToogleView}
              className="button button-primary"
            >
              View
            </button>
            <button
              type="button"
              onClick={onClear}
              className="button button-secondary"
            >
              Clear
            </button>
          </>
        )}
        {viewState == "preview" && (
          <button
            type="button"
            onClick={onToogleView}
            className="button button-primary"
          >
            Edit
          </button>
        )}
      </div>
      <fieldset className="options-fieldset" hidden={viewState !== "edit"}>
        <legend>Select the number of items:</legend>
        <select onChange={onChangeNInputs} defaultValue={nInputs}>
          <option value={16}>16</option>
          <option value={25}>25</option>
        </select>
      </fieldset>
    </div>
  );
}

export default App;
