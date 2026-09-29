"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChatRequestError, streamChat, type ChatEvent, type ChatRequest, type FlowId } from "@/lib/api/assistant";
import type { Photo } from "@/components/assistant/photos";

type StatusName = Extract<ChatEvent, { type: "status" }>["status"];
// What the widget shows for an event stream: statuses and `done` are folded into the turn itself.
export type ShownEvent = Exclude<ChatEvent, { type: "status" } | { type: "done" } | { type: "error" }>;
export type TurnError = { code: string; retryAfter?: number | null };

export type UserTurn = { id: string; role: "user"; text: string; photos?: string[] }; // photos: thumbnail data URLs
export type AssistantTurn = {
  id: string;
  role: "assistant";
  events: ShownEvent[];
  status: StatusName | null; // the last status, shown until content arrives
  streaming: boolean;
  stopped?: boolean;
  messageId?: string; // from `done`: feedback goes to this answer
  error?: TurnError;
  request: Omit<ChatRequest, "conversationId" | "locale">; // to send again after an error (photos only until a reload)
};
export type Turn = UserTurn | AssistantTurn;

const STORAGE_KEY = "assistant-chat";
type Saved = { conversationId: string | null; turns: Turn[] };

function load(): Saved {
  try {
    const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? "null") as Saved | null;
    if (saved && Array.isArray(saved.turns)) return saved;
  } catch {
    /* storage blocked or old format */
  }
  return { conversationId: null, turns: [] };
}

const newId = () => (typeof crypto.randomUUID === "function" ? crypto.randomUUID() : String(Math.random()));

// Appends an event, merging consecutive text pieces so the Markdown renders as one block.
function addEvent(events: ShownEvent[], event: ShownEvent): ShownEvent[] {
  const last = events.at(-1);
  if (event.type === "text" && last?.type === "text") return [...events.slice(0, -1), { ...last, text: last.text + event.text }];
  return [...events, event];
}

// One conversation with the assistant, kept in sessionStorage so a reload or a language switch doesn't lose it.
export function useAssistantChat(locale: string) {
  const [saved] = useState(load);
  const [turns, setTurns] = useState<Turn[]>(() => saved.turns.map((t) => (t.role === "assistant" && t.streaming ? { ...t, streaming: false, stopped: true } : t)));
  const conversationId = useRef<string | null>(saved.conversationId);
  const controller = useRef<AbortController | null>(null);
  const streaming = turns.some((t) => t.role === "assistant" && t.streaming);

  useEffect(() => {
    if (streaming) return;
    try {
      // full-size photos would fill the storage quota: only their thumbnails are kept
      const kept = turns.map((t) => (t.role === "assistant" && t.request.images?.length ? { ...t, request: { ...t.request, images: [] } } : t));
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ conversationId: conversationId.current, turns: kept } satisfies Saved));
    } catch {
      /* storage blocked: the chat lasts for this page view */
    }
  }, [turns, streaming]);

  useEffect(() => () => controller.current?.abort(), []);

  const update = useCallback((id: string, change: (t: AssistantTurn) => AssistantTurn) => {
    setTurns((all) => all.map((t) => (t.id === id && t.role === "assistant" ? change(t) : t)));
  }, []);

  const run = useCallback(
    async (id: string, request: AssistantTurn["request"]) => {
      const abort = new AbortController();
      controller.current = abort;
      try {
        const body: ChatRequest = { ...request, locale, conversationId: conversationId.current };
        for await (const event of streamChat(body, abort.signal)) {
          if (event.type === "status") update(id, (t) => ({ ...t, status: event.status }));
          else if (event.type === "done") {
            conversationId.current = event.conversationId;
            update(id, (t) => ({ ...t, messageId: event.messageId }));
          } else if (event.type === "error") {
            if (event.code === "conversation_not_found") conversationId.current = null;
            update(id, (t) => ({ ...t, error: { code: event.code } }));
          } else update(id, (t) => ({ ...t, events: addEvent(t.events, event) }));
        }
      } catch (e) {
        if (abort.signal.aborted) update(id, (t) => ({ ...t, stopped: true }));
        else {
          const error = e instanceof ChatRequestError ? { code: e.code, retryAfter: e.retryAfter } : { code: "network" };
          update(id, (t) => ({ ...t, error }));
        }
      } finally {
        update(id, (t) => ({ ...t, streaming: false, status: null }));
        if (controller.current === abort) controller.current = null;
      }
    },
    [locale, update],
  );

  // `label` is what the user bubble shows for a starter prompt (its flow gets no text of its own).
  const send = useCallback(
    (message: string, preset?: FlowId, label?: string, photos: Photo[] = []) => {
      if (streaming) return;
      const text = message.trim();
      if (!text && !preset && !photos.length) return;
      const images = photos.map(({ mimeType, data }) => ({ mimeType, data }));
      const request = { message: text, preset: preset ?? null, images };
      const answer: AssistantTurn = { id: newId(), role: "assistant", events: [], status: null, streaming: true, request };
      const user: UserTurn = { id: newId(), role: "user", text: text || label || "", ...(photos.length ? { photos: photos.map((p) => p.thumb) } : {}) };
      setTurns((all) => [...all, user, answer]);
      void run(answer.id, request);
    },
    [run, streaming],
  );

  const retry = useCallback(
    (id: string) => {
      const turn = turns.find((t): t is AssistantTurn => t.id === id && t.role === "assistant");
      if (!turn || streaming) return;
      update(id, (t) => ({ ...t, events: [], error: undefined, stopped: false, messageId: undefined, streaming: true }));
      void run(id, turn.request);
    },
    [run, streaming, turns, update],
  );

  const stop = useCallback(() => controller.current?.abort(), []);

  const reset = useCallback(() => {
    controller.current?.abort();
    conversationId.current = null;
    setTurns([]);
  }, []);

  return { turns, streaming, send, retry, stop, reset };
}
