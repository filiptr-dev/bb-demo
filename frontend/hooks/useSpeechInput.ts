"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

// Speech to text with the browser's own recognition (Chrome, Edge, Safari; not Firefox). Chrome sends the audio to
// Google's speech service; nothing goes through our API. TypeScript's DOM types don't include it yet.
type Recognition = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((e: { resultIndex: number; results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
};
type RecognitionClass = new () => Recognition;

function recognitionClass(): RecognitionClass | undefined {
  const w = window as unknown as { SpeechRecognition?: RecognitionClass; webkitSpeechRecognition?: RecognitionClass };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}

// Site locale → recognition language.
const LANGS: Record<string, string> = {
  mk: "mk-MK",
  en: "en-US",
  sq: "sq-AL",
  bg: "bg-BG",
  de: "de-DE",
  el: "el-GR",
  it: "it-IT",
  ru: "ru-RU",
  sk: "sk-SK",
  tr: "tr-TR",
};

const noop = () => () => {};

// `onText(text, final)`: the words heard so far in this session; `final` once the browser settled on them.
export function useSpeechInput(locale: string, onText: (text: string, final: boolean) => void) {
  const supported = useSyncExternalStore(noop, () => !!recognitionClass(), () => false);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognition = useRef<Recognition | null>(null);
  const handler = useRef(onText);
  useEffect(() => {
    handler.current = onText;
  });

  useEffect(() => () => recognition.current?.abort(), []);

  const start = useCallback(() => {
    const Class = recognitionClass();
    if (!Class || recognition.current) return;
    const r = new Class();
    r.lang = LANGS[locale] ?? locale;
    r.interimResults = true;
    r.continuous = false; // stops after a pause, like a voice message
    r.onresult = (e) => {
      let text = "";
      let final = true;
      for (let i = 0; i < e.results.length; i++) {
        text += e.results[i][0].transcript;
        final &&= e.results[i].isFinal;
      }
      handler.current(text.trim(), final);
    };
    r.onerror = (e) => {
      // "no-speech" and "aborted" are a user who stopped or said nothing, not a fault
      if (e.error !== "no-speech" && e.error !== "aborted") setError(e.error);
    };
    r.onend = () => {
      recognition.current = null;
      setListening(false);
    };
    setError(null);
    recognition.current = r;
    setListening(true);
    try {
      r.start();
    } catch {
      recognition.current = null;
      setListening(false);
      setError("start");
    }
  }, [locale]);

  const stop = useCallback(() => recognition.current?.stop(), []);

  return { supported, listening, error, start, stop };
}
