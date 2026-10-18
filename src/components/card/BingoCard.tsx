import type { Ref } from "react";
import { isMarked, type Card } from "../../card/card";
import type { UpdateCard } from "../../hooks/useCard";
import type { Editing } from "../../hooks/useRoom";
import { CardTitle } from "./CardTitle";
import { Square } from "./Square";

// The part of the page that screenshots and shares: title and squares
export function BingoCard({
  ref,
  card,
  update,
  onToggleMark,
  editing,
}: {
  ref: Ref<HTMLDivElement>;
  card: Card;
  update: UpdateCard;
  onToggleMark: (index: number) => void;
  editing: Editing;
}) {
  const isEditing = card.view === "edit";

  const onSquareChange = (index: number, text: string) =>
    update((current) => ({
      values: current.values.map((value, i) => (i === index ? text : value)),
    }));

  return (
    <div ref={ref} className="bingo-card">
      <CardTitle
        title={card.title}
        isEditing={isEditing}
        lockedBy={editing.lockedBy("title")}
        onChange={(title) => update({ title })}
        onEditStart={() => editing.start("title")}
        onEditEnd={() => editing.end("title")}
      />
      <div
        className={`bingo-wrapper bingo-wrapper--${card.nItems}-items`}
        data-marker={card.marker === "none" ? undefined : card.marker}
      >
        {Array.from({ length: card.nItems }, (_, index) => (
          <Square
            key={index}
            index={index}
            text={card.values[index]}
            marked={isMarked(card.marks, index)}
            isEditing={isEditing}
            lockedBy={editing.lockedBy(index)}
            onChange={onSquareChange}
            onToggleMark={onToggleMark}
            onEditStart={editing.start}
            onEditEnd={editing.end}
          />
        ))}
      </div>
    </div>
  );
}
