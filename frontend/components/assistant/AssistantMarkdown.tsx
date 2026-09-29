"use client";

import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { Link } from "@/i18n/navigation";
import { locales } from "@/i18n/routing";

// The model links site pages root-relative ("/catalog/6205"). Drop a language prefix it may add anyway, since
// next-intl's Link adds the current one.
const localePrefix = new RegExp(`^/(${locales.join("|")})(?=/|$)`);

export function sitePath(href: string): string | null {
  if (!href.startsWith("/") || href.startsWith("//")) return null;
  return href.replace(localePrefix, "") || "/";
}

function components(onNavigate: () => void): Components {
  return {
    a: ({ href = "", children }) => {
      const path = sitePath(href);
      if (path)
        return (
          <Link href={path} onClick={onNavigate} className="font-medium text-brand-2 underline-offset-4 hover:underline">
            {children}
          </Link>
        );
      if (!/^https?:\/\//.test(href)) return <>{children}</>;
      return (
        <a href={href} target="_blank" rel="noopener noreferrer" className="font-medium text-brand-2 underline-offset-4 hover:underline">
          {children}
        </a>
      );
    },
    p: ({ children }) => <p className="my-2 first:mt-0 last:mb-0">{children}</p>,
    ul: ({ children }) => <ul className="my-2 list-disc space-y-1 pl-5">{children}</ul>,
    ol: ({ children }) => <ol className="my-2 list-decimal space-y-1 pl-5">{children}</ol>,
    h1: ({ children }) => <h3 className="mb-1 mt-3 font-semibold">{children}</h3>,
    h2: ({ children }) => <h3 className="mb-1 mt-3 font-semibold">{children}</h3>,
    h3: ({ children }) => <h3 className="mb-1 mt-3 font-semibold">{children}</h3>,
    h4: ({ children }) => <h4 className="mb-1 mt-3 font-semibold">{children}</h4>,
    strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
    code: ({ children }) => <code className="rounded bg-foreground/[0.07] px-1 py-0.5 font-mono text-[0.85em]">{children}</code>,
    pre: ({ children }) => <pre className="my-2 overflow-x-auto rounded-lg bg-foreground/[0.05] p-3 text-xs">{children}</pre>,
    blockquote: ({ children }) => <blockquote className="my-2 border-l-2 border-border pl-3 text-foreground/70">{children}</blockquote>,
    hr: () => <hr className="my-3 border-border" />,
    table: ({ children }) => (
      <div className="my-2 overflow-x-auto rounded-lg border border-border">
        <table className="w-full border-collapse text-xs">{children}</table>
      </div>
    ),
    th: ({ children }) => <th className="border-b border-border bg-foreground/[0.04] px-2.5 py-1.5 text-left font-semibold">{children}</th>,
    td: ({ children }) => <td className="border-b border-border/60 px-2.5 py-1.5 align-top">{children}</td>,
    img: () => null, // no remote images from model output
  };
}

export default function AssistantMarkdown({ text, onNavigate }: { text: string; onNavigate: () => void }) {
  return (
    <div className="text-sm leading-relaxed text-foreground/85 [overflow-wrap:anywhere]">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components(onNavigate)}>
        {text}
      </ReactMarkdown>
    </div>
  );
}
