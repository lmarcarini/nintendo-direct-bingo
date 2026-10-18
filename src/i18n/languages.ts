import { en } from "./en";
import type { Messages } from "./messages";
import { ptBR } from "./pt-BR";

// To add a language: write a `Messages` file next to this one and list it
// here. `id` is a BCP 47 tag (also set as <html lang>), `label` is the
// language's own name, `browserLanguages` are the primary subtags of
// browser languages it answers to, and `timeZones` are where it's the
// local language (the only location hint a browser gives without asking)
export const LANGUAGES = [
  {
    id: "en",
    label: "English",
    messages: en,
    browserLanguages: ["en"],
    timeZones: [],
  },
  {
    id: "pt-BR",
    label: "Português (Brasil)",
    messages: ptBR,
    browserLanguages: ["pt"],
    timeZones: [
      "America/Araguaina",
      "America/Bahia",
      "America/Belem",
      "America/Boa_Vista",
      "America/Campo_Grande",
      "America/Cuiaba",
      "America/Eirunepe",
      "America/Fortaleza",
      "America/Maceio",
      "America/Manaus",
      "America/Noronha",
      "America/Porto_Velho",
      "America/Recife",
      "America/Rio_Branco",
      "America/Santarem",
      "America/Sao_Paulo",
      "Brazil/Acre",
      "Brazil/DeNoronha",
      "Brazil/East",
      "Brazil/West",
    ],
  },
] as const satisfies readonly {
  id: string;
  label: string;
  messages: Messages;
  browserLanguages: readonly string[];
  timeZones: readonly string[];
}[];

export type Language = (typeof LANGUAGES)[number]["id"];

export const DEFAULT_LANGUAGE: Language = "en";

export const isLanguage = (value: unknown): value is Language =>
  LANGUAGES.some((language) => language.id === value);

export const messagesFor = (id: Language): Messages =>
  LANGUAGES.find((language) => language.id === id)!.messages;
