"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Copy, RotateCcw, ThumbsDown, ThumbsUp } from "lucide-react";
import { sendFeedback, type FeedbackReason } from "@/lib/api/assistant";
import type { AssistantTurn, Turn } from "@/hooks/useAssistantChat";
import AssistantMarkdown from "./AssistantMarkdown";
import { ConfidenceBadge, ContactCard, DecodeCard, GreasesCard, ProductsCard, SourcesList, SpecsCard } from "./AssistantCards";

const REASONS: FeedbackReason[] = ["incorrect", "not_what_i_asked", "slow_or_buggy", "style", "safety", "other"];
const iconButton = "inline-flex size-7 items-center justify-center rounded-md text-foreground/45 transition-colors hover:bg-foreground/[0.06] hover:text-foreground disabled:pointer-events-none";

function Feedback({ messageId }: { messageId: string }) {
  const t = useTranslations("Assistant");
  const [rating, setRating] = useState<"up" | "down" | null>(null);
  const [reason, setReason] = useState<FeedbackReason | null>(null);

  function rate(next: "up" | "down", why: FeedbackReason | null = null) {
    setRating(next);
    setReason(why);
    void sendFeedback({ messageId, rating: next, reason: why });
  }

  return (
    <>
      <button type="button" className={`${iconButton} ${rating === "up" ? "text-brand-2" : ""}`} onClick={() => rate("up")} aria-pressed={rating === "up"} aria-label={t("helpful")} title={t("helpful")}>
        <ThumbsUp className="size-3.5" />
      </button>
      <button type="button" className={`${iconButton} ${rating === "down" ? "text-brand-2" : ""}`} onClick={() => rate("down")} aria-pressed={rating === "down"} aria-label={t("notHelpful")} title={t("notHelpful")}>
        <ThumbsDown className="size-3.5" />
      </button>
      {rating === "down" && (
        <div className="basis-full pt-1.5">
          <p className="mb-1.5 text-[11px] text-foreground/55">{reason ? t("thanks") : t("reasons.heading")}</p>
          <div className="flex flex-wrap gap-1.5">
            {REASONS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => rate("down", r)}
                aria-pressed={reason === r}
                className={`rounded-full border px-2.5 py-1 text-[11px] transition-colors ${reason === r ? "border-brand-2 text-brand-2" : "border-border text-foreground/65 hover:border-foreground/30"}`}
              >
                {t(`reasons.${r}`)}
              </button>
            ))}
          </div>
        </div>
      )}
      {rating === "up" && <span className="text-[11px] text-foreground/45">{t("thanks")}</span>}
    </>
  );
}

function CopyButton({ text }: { text: string }) {
  const t = useTranslations("Assistant");
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className={iconButton}
      aria-label={copied ? t("copied") : t("copy")}
      title={copied ? t("copied") : t("copy")}
      onClick={() => {
        void navigator.clipboard?.writeText(text).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        });
      }}
    >
      {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
    </button>
  );
}

function Answer({ turn, onRetry, onNavigate }: { turn: AssistantTurn; onRetry: () => void; onNavigate: () => void }) {
  const t = useTranslations("Assistant");
  const text = turn.events.flatMap((e) => (e.type === "text" ? [e.text] : [])).join("").trim();
  const confidence = turn.events.find((e) => e.type === "confidence");
  const showStatus = turn.streaming && !turn.events.some((e) => e.type !== "confidence");
  const error = turn.error;

  return (
    <div className="space-y-3">
      {showStatus && (
        <p className="flex items-center gap-2 text-xs text-foreground/55" role="status">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-brand-2/60" />
            <span className="relative inline-flex size-2 rounded-full bg-brand-2" />
          </span>
          {t(`status.${turn.status ?? "thinking"}`)}
        </p>
      )}

      {turn.events.map((e, i) => {
        switch (e.type) {
          case "text":
            return <AssistantMarkdown key={i} text={e.text} onNavigate={onNavigate} />;
          case "ask":
            return <p key={i} className="text-sm leading-relaxed text-foreground/85">{t(`ask.${e.ask}`)}</p>;
          case "products":
            return <ProductsCard key={i} event={e} onNavigate={onNavigate} />;
          case "specs":
            return <SpecsCard key={i} event={e} onNavigate={onNavigate} />;
          case "decode":
            return <DecodeCard key={i} event={e} onNavigate={onNavigate} />;
          case "greases":
            return <GreasesCard key={i} event={e} onNavigate={onNavigate} />;
          case "contact":
            return <ContactCard key={i} onNavigate={onNavigate} />;
          case "sources":
            return <SourcesList key={i} event={e} />;
          default:
            return null; // confidence: in the actions row
        }
      })}

      {turn.stopped && !error && <p className="text-xs text-foreground/45">{t("stopped")}</p>}

      {error && (
        <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/[0.06] px-3 py-2 text-xs">
          <p className="text-foreground/80">
            {error.code === "rate_limited"
              ? error.retryAfter
                ? t("errors.rate_limited", { seconds: error.retryAfter })
                : t("errors.rate_limited_later")
              : t.has(`errors.${error.code}`)
                ? t(`errors.${error.code}`)
                : t("errors.request_failed")}
          </p>
          {error.code !== "assistant_busy" && error.code !== "conversation_not_found" && (
            <button type="button" onClick={onRetry} className="mt-1.5 inline-flex items-center gap-1 font-semibold text-brand-2 hover:underline underline-offset-4">
              <RotateCcw className="size-3" /> {t("errors.retry")}
            </button>
          )}
        </div>
      )}

      {!turn.streaming && (text || turn.messageId || confidence) && (
        <div className="-ml-1.5 flex flex-wrap items-center gap-0.5">
          {text && <CopyButton text={text} />}
          {turn.messageId && <Feedback messageId={turn.messageId} />}
          {confidence && (
            <span className="ml-auto">
              <ConfidenceBadge event={confidence} />
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default function AssistantTurnView({ turn, onRetry, onNavigate }: { turn: Turn; onRetry: (id: string) => void; onNavigate: () => void }) {
  if (turn.role === "user")
    return (
      <div className="flex justify-end">
        <p className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-foreground/[0.07] px-3.5 py-2 text-sm [overflow-wrap:anywhere]">{turn.text}</p>
      </div>
    );
  return <Answer turn={turn} onRetry={() => onRetry(turn.id)} onNavigate={onNavigate} />;
}
