import { DEFAULT_CARD, type Card } from "../../card/card";
import type { UpdateCard } from "../../hooks/useCard";
import { useMessages } from "../../i18n/MessagesContext";
import { Icon } from "../ui/Icon";

// Switch between edit and view mode, and clear the squares or the marks
export function CardActions({
  card,
  update,
}: {
  card: Card;
  update: UpdateCard;
}) {
  const t = useMessages();
  const isEditing = card.view === "edit";

  const onClear = () => {
    // The URL is the only copy of the card, so there is no undo
    if (
      (card.values.some(Boolean) || card.marks) &&
      !window.confirm(t.confirmClear)
    )
      return;
    update({ values: DEFAULT_CARD.values, marks: 0 });
  };

  const onClearMarks = () => {
    if (window.confirm(t.confirmClearMarks)) update({ marks: 0 });
  };

  return (
    <div className="button-group button-group--end">
      {!isEditing && card.marks !== 0 && (
        <button
          type="button"
          onClick={onClearMarks}
          className="button button-secondary"
        >
          <Icon name="undo" />
          {t.clearMarks}
        </button>
      )}
      <button
        type="button"
        onClick={() => update({ view: isEditing ? "preview" : "edit" })}
        className="button button-primary"
      >
        <Icon name={isEditing ? "eye" : "pencil"} />
        {isEditing ? t.view : t.edit}
      </button>
      {isEditing && (
        <button
          type="button"
          onClick={onClear}
          className="button button-secondary"
        >
          <Icon name="trash" />
          {t.clear}
        </button>
      )}
    </div>
  );
}
