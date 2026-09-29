"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ArrowUp, Droplet, FileText, MapPin, PanelRightClose, PanelRightOpen, Search, Sparkles, Square, SquarePen, Tag, X } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { MAX_MESSAGE, type FlowId } from "@/lib/api/assistant";
import { useAssistantChat } from "@/hooks/useAssistantChat";
import AssistantTurnView from "./AssistantTurn";

const STARTERS: { id: FlowId; icon: typeof Search }[] = [
  { id: "product_search", icon: Search },
  { id: "datasheet", icon: FileText },
  { id: "decode", icon: Tag },
  { id: "grease", icon: Droplet },
  { id: "where_to_buy", icon: MapPin },
];
const DOCK_KEY = "assistant-docked";
const headerButton = "inline-flex size-8 items-center justify-center rounded-lg text-foreground/55 transition-colors hover:bg-foreground/[0.06] hover:text-foreground";

function readDocked() {
  try {
    return localStorage.getItem(DOCK_KEY) === "1";
  } catch {
    return false;
  }
}

// On a phone the panel covers the page, so following a link closes it.
const coversPage = () => window.matchMedia("(max-width: 639px)").matches;

export default function AssistantPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useTranslations("Assistant");
  const locale = useLocale();
  const { turns, streaming, send, retry, stop, reset } = useAssistantChat(locale);
  const [input, setInput] = useState("");
  const [docked, setDocked] = useState(readDocked);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const examples = t.raw("examples") as string[];

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // follow the answer as it streams, unless the reader scrolled up
  const stick = useRef(true);
  useEffect(() => {
    const el = scrollRef.current;
    if (el && stick.current && turns.length > 0) el.scrollTop = el.scrollHeight;
  }, [turns]);

  // the textarea grows with its text, up to ~6 lines
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [input]);

  function submit() {
    if (streaming || !input.trim()) return;
    stick.current = true;
    send(input);
    setInput("");
  }

  // an example or a suggested follow-up: sent as it is
  function ask(question: string) {
    if (streaming) return;
    stick.current = true;
    send(question);
    inputRef.current?.focus();
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit();
    }
  }

  function toggleDock() {
    const next = !docked;
    setDocked(next);
    try {
      localStorage.setItem(DOCK_KEY, next ? "1" : "0");
    } catch {
      /* storage blocked */
    }
  }

  const onNavigate = () => {
    if (coversPage()) onClose();
  };

  return (
    <aside
      aria-label={t("title")}
      hidden={!open}
      onKeyDown={(e) => e.key === "Escape" && onClose()}
      className={cn(
        "fixed z-[60] flex flex-col overflow-hidden border-border bg-card text-foreground shadow-2xl",
        "inset-0 sm:inset-auto",
        docked
          ? "sm:inset-y-0 sm:right-0 sm:w-[420px] sm:border-l"
          : "sm:bottom-5 sm:right-5 sm:h-[min(640px,calc(100dvh-2.5rem))] sm:w-[420px] sm:rounded-2xl sm:border",
        open && "animate-in fade-in slide-in-from-bottom-2 duration-200",
      )}
    >
      <header className="flex items-center gap-2.5 border-b border-border px-4 py-3">
        <span className="flex size-8 items-center justify-center rounded-lg bg-brand-gradient text-white">
          <Sparkles className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-sm font-semibold">{t("title")}</h2>
          <p className="truncate text-[11px] text-foreground/50">{t("subtitle")}</p>
        </div>
        {turns.length > 0 && (
          <button type="button" className={headerButton} onClick={() => { reset(); inputRef.current?.focus(); }} aria-label={t("newChat")} title={t("newChat")}>
            <SquarePen className="size-4" />
          </button>
        )}
        <button type="button" className={cn(headerButton, "max-sm:hidden")} onClick={toggleDock} aria-label={docked ? t("undock") : t("dock")} title={docked ? t("undock") : t("dock")}>
          {docked ? <PanelRightClose className="size-4" /> : <PanelRightOpen className="size-4" />}
        </button>
        <button type="button" className={headerButton} onClick={onClose} aria-label={t("close")} title={t("close")}>
          <X className="size-4" />
        </button>
      </header>

      <div
        ref={scrollRef}
        onScroll={(e) => {
          const el = e.currentTarget;
          stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
        }}
        className="flex-1 overflow-y-auto overscroll-contain px-4 py-4"
        aria-live="polite"
        aria-busy={streaming}
      >
        {turns.length === 0 ? (
          <div>
            <h3 className="text-base font-semibold">{t("welcomeTitle")}</h3>
            <p className="mt-1 text-sm leading-relaxed text-foreground/60">{t("welcomeBody")}</p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {STARTERS.map(({ id, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    send("", id, t(`starters.${id}`));
                    inputRef.current?.focus(); // a starter usually asks for a designation next
                  }}
                  className="flex items-center gap-2 rounded-xl border border-border px-3 py-2.5 text-left text-xs font-medium transition-colors hover:border-brand-2/50 hover:bg-foreground/[0.03] last:odd:col-span-2"
                >
                  <Icon className="size-4 shrink-0 text-brand-2" />
                  {t(`starters.${id}`)}
                </button>
              ))}
            </div>
            <p className="mt-5 text-[11px] font-semibold uppercase tracking-wider text-foreground/45">{t("examplesHeading")}</p>
            <ul className="mt-2 space-y-1">
              {examples.map((q) => (
                <li key={q}>
                  <button
                    type="button"
                    onClick={() => ask(q)}
                    className="w-full rounded-lg px-2 py-1.5 text-left text-sm text-foreground/70 transition-colors hover:bg-foreground/[0.04] hover:text-foreground"
                  >
                    {q}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="space-y-5">
            {turns.map((turn, i) => (
              <AssistantTurnView key={turn.id} turn={turn} last={i === turns.length - 1} onRetry={retry} onSend={ask} onNavigate={onNavigate} />
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-border px-3 pb-2 pt-3">
        <div className="flex items-end gap-2 rounded-xl border border-border bg-background/40 py-1.5 pl-3 pr-1.5 focus-within:border-brand-2/60">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            rows={1}
            maxLength={MAX_MESSAGE}
            placeholder={t("placeholder")}
            aria-label={t("inputAria")}
            className="max-h-40 min-h-8 flex-1 resize-none bg-transparent py-1.5 text-sm outline-none placeholder:text-foreground/40"
          />
          {streaming ? (
            <button type="button" onClick={stop} aria-label={t("stop")} title={t("stop")} className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-foreground/10 text-foreground hover:bg-foreground/15">
              <Square className="size-3.5 fill-current" />
            </button>
          ) : (
            <button
              type="button"
              onClick={submit}
              disabled={!input.trim()}
              aria-label={t("send")}
              title={t("send")}
              className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand-gradient text-white transition-opacity disabled:opacity-30"
            >
              <ArrowUp className="size-4" />
            </button>
          )}
        </div>
        {input.length > MAX_MESSAGE * 0.9 && (
          <p className="mt-1 text-right text-[11px] text-foreground/50">{t("tooLong", { count: input.length, max: MAX_MESSAGE })}</p>
        )}
        <p className="mt-2 px-1 text-[10.5px] leading-snug text-foreground/40">
          {t("disclaimer")}{" "}
          <Link href="/terms" onClick={onNavigate} className="underline underline-offset-2 hover:text-foreground/70">{t("terms")}</Link>
          {" · "}
          <Link href="/privacy" onClick={onNavigate} className="underline underline-offset-2 hover:text-foreground/70">{t("privacy")}</Link>
        </p>
      </div>
    </aside>
  );
}
