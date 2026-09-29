import type { components } from "./schema";

// The assistant API (backend/app/modules/assistant). The chat answer is a JSON Lines stream: one event per line,
// ending with `done`. openapi-typescript doesn't read the stream's itemSchema yet, so the union is spelled out here
// from the generated event schemas.
type S = components["schemas"];
export type ChatEvent =
  | S["StatusEvent"]
  | S["TextEvent"]
  | S["ProductsEvent"]
  | S["AskEvent"]
  | S["SpecsEvent"]
  | S["DecodeEvent"]
  | S["GreasesEvent"]
  | S["ContactEvent"]
  | S["SourcesEvent"]
  | S["ConfidenceEvent"]
  | S["SuggestionsEvent"]
  | S["ErrorEvent"]
  | S["DoneEvent"];
export type ChatRequest = S["ChatRequest"];
export type FlowId = NonNullable<ChatRequest["preset"]>;
export type FeedbackReason = NonNullable<S["FeedbackRequest"]["reason"]>;
export const MAX_MESSAGE = 2000;

const baseUrl = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");

// A failure before the stream started: the API's problem `code` (rate_limited, validation_failed, ...) or "network".
export class ChatRequestError extends Error {
  constructor(
    readonly code: string,
    readonly retryAfter: number | null = null,
  ) {
    super(code);
  }
}

async function problemCode(res: Response): Promise<string> {
  try {
    const body = await res.json();
    if (typeof body?.code === "string") return body.code;
  } catch {
    /* not problem+json */
  }
  return res.status >= 500 ? "assistant_unavailable" : "request_failed";
}

// Sends one chat turn and yields its events as they arrive. No timeout of its own: a sleeping API instance takes
// up to a minute to wake, and the user can stop with `signal`.
export async function* streamChat(body: ChatRequest, signal: AbortSignal): AsyncGenerator<ChatEvent> {
  if (!baseUrl) throw new ChatRequestError("assistant_unavailable");
  let res: Response;
  try {
    res = await fetch(`${baseUrl}/api/v1/assistant/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal,
    });
  } catch (e) {
    if (signal.aborted) throw e;
    throw new ChatRequestError("network");
  }
  if (!res.ok || !res.body) {
    const retryAfter = Number(res.headers.get("Retry-After")) || null;
    throw new ChatRequestError(await problemCode(res), retryAfter);
  }

  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += value;
      let newline: number;
      while ((newline = buffer.indexOf("\n")) >= 0) {
        const line = buffer.slice(0, newline).trim();
        buffer = buffer.slice(newline + 1);
        if (line) yield JSON.parse(line) as ChatEvent;
      }
    }
  } catch (e) {
    if (signal.aborted) throw e;
    throw new ChatRequestError("network");
  } finally {
    reader.releaseLock();
  }
  if (buffer.trim()) yield JSON.parse(buffer) as ChatEvent;
}

export async function sendFeedback(body: S["FeedbackRequest"]): Promise<boolean> {
  if (!baseUrl) return false;
  try {
    const res = await fetch(`${baseUrl}/api/v1/assistant/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return res.ok;
  } catch {
    return false;
  }
}
