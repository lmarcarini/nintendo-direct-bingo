import { MARKERS, type Marker } from "../../card/markers";
import { useMessages } from "../../i18n/MessagesContext";

export function MarkerPicker({
  value,
  onChange,
}: {
  value: Marker;
  onChange: (value: Marker) => void;
}) {
  const t = useMessages();
  return (
    <fieldset className="options-group">
      <legend>{t.marker}</legend>
      <div className="marker-picker">
        {MARKERS.map((marker) => (
          <label key={marker} className="option-choice marker-chip">
            <input
              type="radio"
              name="marker"
              className="option-radio"
              checked={value === marker}
              onChange={() => onChange(marker)}
            />
            {/* A marked square drawn with this marker */}
            <span
              data-marker={marker === "none" ? undefined : marker}
              className="marker-preview"
              aria-hidden="true"
            >
              <span className="bingo-input--marked"></span>
            </span>
            {t.markers[marker]}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
