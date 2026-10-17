import { SQUARE_COUNTS, type SquareCount } from "../../card/card";
import { useMessages } from "../../i18n/MessagesContext";

export function SquareCountPicker({
  value,
  onChange,
}: {
  value: SquareCount;
  onChange: (value: SquareCount) => void;
}) {
  const t = useMessages();
  return (
    <fieldset className="options-group">
      <legend>{t.squares}</legend>
      <div className="segmented">
        {SQUARE_COUNTS.map((n) => (
          <label key={n} className="option-choice">
            <input
              type="radio"
              name="squares"
              className="option-radio"
              checked={value === n}
              onChange={() => onChange(n)}
            />
            {n === 16 ? "4 × 4" : "5 × 5"}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
