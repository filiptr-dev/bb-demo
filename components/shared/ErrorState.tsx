import type { ReactNode } from "react";

// Shared body of the 404 / 401 / 403 / 500 pages: big status code, heading, one line of help, then actions.
export default function ErrorState({ code, title, text, children, note }: {
  code: string;
  title: string;
  text: string;
  children?: ReactNode;
  note?: ReactNode;
}) {
  return (
    <section className="container mx-auto max-w-3xl px-6 pt-32 pb-24 text-center">
      <p aria-hidden className="font-numbers text-[7rem] md:text-[9rem] leading-none text-gradient-brand select-none">{code}</p>
      <h1 className="mt-4 font-display font-black text-3xl md:text-4xl tracking-tighter">{title}</h1>
      <p className="mt-4 mx-auto max-w-xl text-foreground/65 leading-relaxed">{text}</p>
      {children && <div className="mt-8 flex flex-wrap justify-center gap-3">{children}</div>}
      {note && <div className="mt-8 text-xs text-foreground/45">{note}</div>}
    </section>
  );
}
