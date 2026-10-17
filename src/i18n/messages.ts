import type { Completion } from "../card/completions";
import type { Marker } from "../card/markers";
import type { en } from "./en";

// Every language has English's shape, with the keyed groups spelled out so
// they follow the ids in src/card
export type Messages = typeof en & {
  celebrations: Record<Completion, string>;
  markers: Record<Marker, string>;
};
