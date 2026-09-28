import type { Locale } from "./routing";
import type en from "@/messages/en.json";

export type Messages = typeof en;

// One JSON file per locale; the bundler splits them, so adding a language needs no import here.
export const loadMessages = async (locale: Locale): Promise<Messages> => (await import(`../messages/${locale}.json`)).default;
