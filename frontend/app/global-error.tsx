"use client";

import { useEffect } from "react";
import "./globals.css";

// Replaces the [locale] layout when the layout itself fails, so there is no i18n provider here:
// the copy is Macedonian (the default locale) with English underneath.
export default function GlobalError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="mk" data-theme="client" className="dark antialiased">
      <body className="min-h-screen flex items-center justify-center bg-background text-foreground font-sans">
        <title>Грешка | B&B Unikoop</title>
        <main className="max-w-xl px-6 text-center">
          <p aria-hidden className="text-[7rem] font-black leading-none text-gradient-brand select-none">500</p>
          <h1 className="mt-4 text-3xl font-black tracking-tight">Настана грешка</h1>
          <p className="mt-3 text-foreground/65 leading-relaxed">
            Страницата не може да се вчита. Обидете се повторно или јавете ни се.
          </p>
          <p lang="en" className="mt-2 text-sm text-foreground/45">Something went wrong. Please try again or give us a call.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <button onClick={retry} className="rounded-full bg-brand-gradient text-white px-5 py-2 text-sm font-medium">
              Обиди се повторно · Try again
            </button>
            {/* a plain <a> on purpose: a full page load rebuilds the broken layout */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href="/" className="rounded-full border border-foreground/15 px-5 py-2 text-sm font-medium">Почетна · Home</a>
          </div>
          {error.digest && <p className="mt-8 text-xs text-foreground/40">Ref: {error.digest}</p>}
        </main>
      </body>
    </html>
  );
}
