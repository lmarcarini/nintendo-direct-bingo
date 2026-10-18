import { useRef } from "react";
import { DEFAULT_TITLE, isMarked, toggleMark, type Card } from "./card/card";
import { newCompletions } from "./card/completions";
import { CardActions } from "./components/actions/CardActions";
import { ShareActions } from "./components/actions/ShareActions";
import { BingoCard } from "./components/card/BingoCard";
import { Celebration } from "./components/Celebration";
import { LanguagePicker } from "./components/LanguagePicker";
import { OptionsPanel } from "./components/options/OptionsPanel";
import { useCard } from "./hooks/useCard";
import { useCelebrations } from "./hooks/useCelebrations";
import { useDocumentTheme } from "./hooks/useDocumentTheme";
import { useDocumentTitle } from "./hooks/useDocumentTitle";
import { messagesFor } from "./i18n/languages";
import { MessagesContext } from "./i18n/MessagesContext";
import { useLanguage } from "./i18n/useLanguage";

function App({ initialCard }: { initialCard: Card }) {
  const [card, update] = useCard(initialCard);
  const [language, setLanguage] = useLanguage();
  const { celebration, celebrate, dismiss } = useCelebrations();
  const cardRef = useRef<HTMLDivElement>(null);
  const title = card.title || DEFAULT_TITLE;

  useDocumentTheme(card.theme);
  useDocumentTitle(title);

  // A mark that completes a line or the card celebrates, if the card says so
  const onToggleMark = (index: number) => {
    const marks = toggleMark(card.marks, index);
    update({ marks });
    if (card.animations && isMarked(marks, index))
      celebrate(newCompletions(marks, index, card.nItems, card));
  };

  return (
    <MessagesContext value={messagesFor(language)}>
      <div className="content-wrapper">
        <BingoCard
          ref={cardRef}
          card={card}
          update={update}
          onToggleMark={onToggleMark}
        />
        <div className="button-wrapper">
          <ShareActions cardRef={cardRef} title={title} />
          <CardActions card={card} update={update} />
        </div>
        <OptionsPanel card={card} update={update} />
        <LanguagePicker value={language} onChange={setLanguage} />
        {celebration && (
          <Celebration
            key={celebration.id}
            kind={celebration.kind}
            onEnd={dismiss}
          />
        )}
      </div>
    </MessagesContext>
  );
}

export default App;
