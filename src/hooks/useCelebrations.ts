import { useRef, useState } from "react";
import type { Completion } from "../card/completions";

export type Celebration = { id: number; kind: Completion };

// Queue of full-screen animations; the first one is showing. A new mark's
// completions replace whatever was still queued
export const useCelebrations = () => {
  const [queue, setQueue] = useState<Celebration[]>([]);
  const nextId = useRef(0);

  const celebrate = (kinds: Completion[]) => {
    if (kinds.length)
      setQueue(kinds.map((kind) => ({ id: nextId.current++, kind })));
  };

  const dismiss = () => setQueue((current) => current.slice(1));

  return { celebration: queue[0] as Celebration | undefined, celebrate, dismiss };
};
