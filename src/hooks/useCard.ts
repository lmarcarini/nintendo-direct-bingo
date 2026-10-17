import { useCallback, useEffect, useState } from "react";
import type { Card } from "../card/card";
import { writeCard } from "../card/cardUrl";

export type CardChange = Partial<Card> | ((card: Card) => Partial<Card>);
export type UpdateCard = (change: CardChange) => void;

// The card is the app's one piece of shared state, saved to the URL on
// every change. Rooms will plug in here: send local changes, apply remote ones
export const useCard = (initialCard: Card) => {
  const [card, setCard] = useState(initialCard);

  const update: UpdateCard = useCallback(
    (change) =>
      setCard((current) => ({
        ...current,
        ...(typeof change === "function" ? change(current) : change),
      })),
    []
  );

  useEffect(() => {
    writeCard(card);
  }, [card]);

  return [card, update] as const;
};
