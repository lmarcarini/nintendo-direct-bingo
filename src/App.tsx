import { useState } from "react";
import "./App.css";
import DOMPurify from 'dompurify'; 

function App() {
  const searchParams = new URL(window.location.href).searchParams;
  
  const [viewState, setView] = useState(searchParams.get("view") || "edit");
  const [nInputs, setNInputs] = useState(+(searchParams.get("nItems") || 16));

  const inputList = new Array(25)
    .fill("teste")
    .map((_, i) => ({ index: i, value: searchParams.get(i.toString()) }));

  const onChangeNInputs = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const curNInputs = e.currentTarget.value;
    setNInputs(+curNInputs);
    const url = new URL(window.location.href);
    url.searchParams.set("nItems", curNInputs);
    window.history.pushState({}, "", url);
  };

  const onChangeItem = (e: React.FormEvent<HTMLDivElement>) => {
    const nItem = e.currentTarget.dataset.name;
    const value = e.currentTarget.innerHTML;
    if (nItem == null) return;
    
    const url = new URL(window.location.href);
    url.searchParams.set(nItem.toString(), value);
    window.history.pushState({}, "", url);
  };

  const onToogleView = () => {
    if (viewState === "edit") {
      const url = new URL(window.location.href);
      searchParams.set("view", "preview");
      window.history.pushState({}, "", url);
      setView("preview");
      return;
    }
    if (viewState == "preview") setView("edit");
    const url = new URL(window.location.href);
    url.searchParams.set("view", "edit");
    window.history.pushState({}, "", url);
  };

  return (
    <div className="content-wrapper">
      <div className="bingo-card">
        <h1>Nintendo Direct Bingo</h1>
        <div className={`bingo-wrapper bingo-wrapper--${nInputs}-items`}>
          {inputList.slice(0, nInputs).map((item) => (
            <div
              suppressContentEditableWarning={true}
              onInput={onChangeItem}
              key={item.index}
              data-name={item.index}
              contentEditable={viewState == "edit"}
              className="bingo-input"
              dangerouslySetInnerHTML={{__html: DOMPurify.sanitize(item.value || "")}}
            >
            </div>
          ))}
        </div>
      </div>
      <div className="button-wrapper">
        {viewState == "edit" && (
          <button
            type="button"
            onClick={onToogleView}
            className="button button-primary"
          >
            Visualizar
          </button>
        )}
        {viewState == "preview" && (
          <button
            type="button"
            onClick={onToogleView}
            className="button button-primary"
          >
            Editar
          </button>
        )}
      </div>
        <fieldset className="options-fieldset" hidden={viewState !== "edit"}>
          <legend>Selecione o número de items:</legend>
          <select onChange={onChangeNInputs} defaultValue={nInputs}>
            <option value={16}>16</option>
            <option value={25}>25</option>
          </select>
        </fieldset>
      
    </div>
  );
}

export default App;
