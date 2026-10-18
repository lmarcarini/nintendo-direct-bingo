import type { Card } from "../../card/card";
import type { UpdateCard } from "../../hooks/useCard";
import { useMessages } from "../../i18n/MessagesContext";
import { CelebrationOptions } from "./CelebrationOptions";
import { MarkerPicker } from "./MarkerPicker";
import { SquareCountPicker } from "./SquareCountPicker";
import { ThemePicker } from "./ThemePicker";

// Card settings, only shown while editing
export function OptionsPanel({
  card,
  update,
}: {
  card: Card;
  update: UpdateCard;
}) {
  const t = useMessages();
  return (
    <details className="options" hidden={card.view !== "edit"}>
      <summary className="options-summary">{t.cardOptions}</summary>
      <div className="options-body">
        <SquareCountPicker
          value={card.nItems}
          onChange={(nItems) => update({ nItems })}
        />
        <ThemePicker
          value={card.theme}
          onChange={(theme) => update({ theme })}
        />
        <MarkerPicker
          value={card.marker}
          onChange={(marker) => update({ marker })}
        />
        <CelebrationOptions settings={card} onChange={update} />
      </div>
    </details>
  );
}
