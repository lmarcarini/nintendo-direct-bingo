import type { Card } from "../../card/card";
import { useMessages } from "../../i18n/MessagesContext";
import { Switch } from "../ui/Switch";

type Settings = Pick<Card, "animations" | "diagonals" | "everyLine">;

// Part of the card, so everyone with the link plays by the same rules
export function CelebrationOptions({
  settings,
  onChange,
}: {
  settings: Settings;
  onChange: (change: Partial<Settings>) => void;
}) {
  const t = useMessages();
  return (
    <fieldset className="options-group">
      <legend>{t.celebrationsGroup}</legend>
      <Switch
        label={t.animations}
        hint={t.animationsHint}
        checked={settings.animations}
        onChange={(animations) => onChange({ animations })}
      />
      <Switch
        label={t.diagonals}
        hint={t.diagonalsHint}
        checked={settings.diagonals}
        disabled={!settings.animations}
        onChange={(diagonals) => onChange({ diagonals })}
      />
      <Switch
        label={t.everyLine}
        hint={t.everyLineHint}
        checked={settings.everyLine}
        disabled={!settings.animations}
        onChange={(everyLine) => onChange({ everyLine })}
      />
    </fieldset>
  );
}
