import type { Completion } from "../card/completions";
import { useMessages } from "../i18n/MessagesContext";

// Full-screen overlay, styled per theme in styles/celebration.css. It ends
// with its own fade, and calls onEnd so the next one can show
export function Celebration({
  kind,
  onEnd,
}: {
  kind: Completion;
  onEnd: () => void;
}) {
  const t = useMessages();
  return (
    <div
      role="status"
      className={`celebration celebration--${kind}`}
      onAnimationEnd={(e) => {
        // Ignore the decorations' animations, only the overlay's own fade
        if (e.animationName === "celebration-fade") onEnd();
      }}
    >
      <span className="celebration-text">{t.celebrations[kind]}</span>
    </div>
  );
}
