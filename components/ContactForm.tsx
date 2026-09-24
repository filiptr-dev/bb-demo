"use client";

import { useState } from "react";
import { CheckCircle2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function ContactForm() {
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
      if (!r.ok) throw new Error(j.error || "Грешка. Обидете се повторно.");
      setState("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Грешка. Обидете се повторно.");
      setState("idle");
    }
  }

  if (state === "done")
    return (
      <div role="status" className="rounded-2xl border bg-card p-8 text-center">
        <CheckCircle2 className="mx-auto mb-3 size-10 text-brand-2" />
        <h2 className="font-display text-xl font-bold">Ви благодариме!</h2>
        <p className="mt-1 text-sm text-muted-foreground">Пораката е испратена. Ќе ви одговориме во најкраток рок.</p>
      </div>
    );

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border bg-card p-6 md:p-8" noValidate={false}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5"><Label htmlFor="name">Име и презиме *</Label><Input id="name" name="name" required minLength={2} maxLength={100} autoComplete="name" className="h-10" /></div>
        <div className="space-y-1.5"><Label htmlFor="email">Е-пошта *</Label><Input id="email" name="email" type="email" required autoComplete="email" className="h-10" /></div>
      </div>
      <div className="space-y-1.5"><Label htmlFor="phone">Телефон</Label><Input id="phone" name="phone" type="tel" autoComplete="tel" className="h-10" /></div>
      <div className="space-y-1.5"><Label htmlFor="message">Порака *</Label><Textarea id="message" name="message" required minLength={5} maxLength={3000} placeholder="Ознака на лежиште, количина, индустрија…" /></div>
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
      <label className="flex items-start gap-2 text-xs text-muted-foreground">
        <input type="checkbox" name="consent" required className="mt-0.5 size-4 accent-[#FF5A32]" />
        <span>Се согласувам моите податоци да се обработат за одговор на барањето, согласно <a href="/privacy" className="text-brand-2 underline">Политиката за приватност</a>. *</span>
      </label>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={state === "sending"} className="h-11 rounded-full bg-brand-gradient px-7 text-xs font-semibold uppercase tracking-wide text-white">
        <Send className="size-4" /> {state === "sending" ? "Се испраќа…" : "Испрати"}
      </Button>
    </form>
  );
}
