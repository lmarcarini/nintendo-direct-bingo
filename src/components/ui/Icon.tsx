// Stroke icons on a 24×24 grid, drawn in the text color
const ICONS = {
  image: [
    "M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z",
    "M7 9a2 2 0 1 0 4 0a2 2 0 1 0-4 0",
    "m21 15-5-5L5 21",
  ],
  link: [
    "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71",
    "M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71",
  ],
  share: ["M12 3v12", "m7 8 5-5 5 5", "M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"],
  eye: [
    "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z",
    "M9 12a3 3 0 1 0 6 0a3 3 0 1 0-6 0",
  ],
  pencil: ["M17 3l4 4L8 20H4v-4Z"],
  trash: ["M3 6h18", "M8 6V4h8v2", "M6 6l1 14h10l1-14"],
  undo: ["M3 12a9 9 0 1 0 3-6.7L3 8", "M3 3v5h5"],
  check: ["M20 6 9 17l-5-5"],
  close: ["M18 6 6 18", "M6 6l12 12"],
  grid: ["M4 4h6v6H4Z", "M14 4h6v6h-6Z", "M4 14h6v6H4Z", "M14 14h6v6h-6Z"],
  alert: ["M3 12a9 9 0 1 0 18 0a9 9 0 1 0-18 0", "M12 8v4", "M12 16h.01"],
  globe: [
    "M3 12a9 9 0 1 0 18 0a9 9 0 1 0-18 0",
    "M3 12h18",
    "M12 3a14 14 0 0 1 0 18a14 14 0 0 1 0-18",
  ],
};

type IconName = keyof typeof ICONS;

export function Icon({ name }: { name: IconName }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="icon"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {ICONS[name].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}
