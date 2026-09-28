"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { CheckCircle2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function ContactForm() {
  const t = useTranslations("Contact.form");
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setState("sending"); setError("");
    try {
      const r = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: f.get("name"), email: f.get("email"), phone: f.get("phone"), message: f.get("message"), website: f.get("website"), consent: f.get("consent") === "on" }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(["invalid", "required", "send"].includes(j.code) ? t(`errors.${j.code}`) : t("genericError"));
      setState("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("genericError"));
      setState("idle");
    }
  }

  if (state === "done")
    return (
      <div role="status" className="rounded-2xl border bg-card p-8 text-center">
        <CheckCircle2 className="mx-auto mb-3 size-10 text-brand-2" />
        <h2 className="font-display text-xl font-bold">{t("thanksTitle")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("thanksBody")}</p>
      </div>
    );

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border bg-card p-6 md:p-8" noValidate={false}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5"><Label htmlFor="name">{t("name")}</Label><Input id="name" name="name" required minLength={2} maxLength={100} autoComplete="name" className="h-10" /></div>
        <div className="space-y-1.5"><Label htmlFor="email">{t("email")}</Label><Input id="email" name="email" type="email" required autoComplete="email" className="h-10" /></div>
      </div>
      <div className="space-y-1.5"><Label htmlFor="phone">{t("phone")}</Label><Input id="phone" name="phone" type="tel" autoComplete="tel" className="h-10" /></div>
      <div className="space-y-1.5"><Label htmlFor="message">{t("message")}</Label><Textarea id="message" name="message" required minLength={5} maxLength={3000} placeholder={t("messagePlaceholder")} /></div>
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
      <label className="flex items-start gap-2 text-xs text-muted-foreground">
        <input type="checkbox" name="consent" required className="mt-0.5 size-4 accent-brand-1" />
        <span>{t.rich("consent", { link: (chunks) => <Link href="/privacy" className="text-brand-2 underline">{chunks}</Link> })}</span>
      </label>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={state === "sending"} className="h-11 rounded-full bg-brand-gradient px-7 text-xs font-semibold uppercase tracking-wide text-white">
        <Send className="size-4" /> {state === "sending" ? t("sending") : t("submit")}
      </Button>
    </form>
  );
}
