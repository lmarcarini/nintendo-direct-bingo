import { createContext, use } from "react";
import { en } from "./en";
import type { Messages } from "./messages";

// The viewer's translations, provided once by App
export const MessagesContext = createContext<Messages>(en);

export const useMessages = () => use(MessagesContext);
