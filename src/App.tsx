import { useEffect, useRef, useState } from "react";
import "./App.css";
import DOMPurify from "dompurify";
import { adjustFontSize } from "./utils/adjustFontSize";

const searchParams = new URL(window.location.href).searchParams;

const inputList = new Array(25).fill(null).map((_, i) => {
  const encodedValue = searchParams.get(i.toString());
  return {
    index: i,
    value: encodedValue ? DOMPurify.sanitize(atob(encodedValue)) : "",
  };
});

function App() {
  const [viewState, setView] = useState(searchParams.get("view") || "edit");
  const [nInputs, setNInputs] = useState(+(searchParams.get("nItems") || 16));

  const onChangeNInputs = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const curNInputs = e.currentTarget.value;
    setNInputs(+curNInputs);
    const url = new URL(window.location.href);
    url.searchParams.set("nItems", curNInputs);
    window.history.pushState({}, "", url);
  };

  const onChangeItem = (e: React.FormEvent<HTMLDivElement>) => {
    const nItem = e.currentTarget.dataset.name;
    const value = DOMPurify.sanitize(e.currentTarget.innerHTML);
    if (nItem == null) return;

    const url = new URL(window.location.href);
    url.searchParams.set(nItem.toString(), btoa(value));
    window.history.pushState({}, "", url);
    adjustFontSize(e.currentTarget);
  };

  const onToogleView = () => {
    const newViewState = viewState === "edit" ? "preview" : "edit";
    setView(newViewState);
    const url = new URL(window.location.href);
    url.searchParams.set("view", newViewState);
    window.history.pushState({}, "", url);
  };

  const bingoRefs = useRef<(HTMLDivElement | null)[]>([]);
  useEffect(() => {
    const adjustAllFontSizes = () => {
      bingoRefs.current.forEach((ref) => {
        if (ref) adjustFontSize(ref);
      });
    };

    // Run immediately after DOM is painted
    adjustAllFontSizes();

    // Also adjust when window resizes (optional)
    const resizeObserver = new ResizeObserver(adjustAllFontSizes);
    bingoRefs.current.forEach((ref) => {
      if (ref) {
        resizeObserver.observe(ref);
      }
    });

    return () => resizeObserver.disconnect();
  }, []); // Re-run when view or number of items changes

  const onClear = () => {
    bingoRefs.current.forEach((ref) => {
      const url = new URL(window.location.href);
      if (ref) {
        ref.innerHTML = "";
        const name = ref.dataset.name;
        if (name) url.searchParams.delete(name);
      }
      window.history.pushState({}, "", url);
    });
  };

  return (
    <div className="content-wrapper">
      <div className="bingo-card">
        <h1>Nintendo Direct Bingo</h1>
        <div className={`bingo-wrapper bingo-wrapper--${nInputs}-items`}>
          {inputList.slice(0, nInputs).map((item, index) => (
            <div
              ref={(el) => (bingoRefs.current[index] = el)}
              suppressContentEditableWarning={true}
              onInput={onChangeItem}
              key={item.index}
              data-name={item.index}
              contentEditable={viewState == "edit"}
              className="bingo-input"
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(item.value || ""),
              }}
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
