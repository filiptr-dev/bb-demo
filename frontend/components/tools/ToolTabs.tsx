import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

const tools = [
  { href: "/decoder", key: "decoder" },
  { href: "/size-finder", key: "sizeFinder" },
] as const;

// Switches between the tool pages; the header only has room to link one of them.
export default function ToolTabs({ current }: { current: (typeof tools)[number]["key"] }) {
  const t = useTranslations("Nav");
  return (
    <nav className="mb-8 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-wider">
      {tools.map((tool) => (
        <Link
          key={tool.key}
          href={tool.href}
          aria-current={tool.key === current ? "page" : undefined}
          className={`rounded-full border px-3.5 py-1.5 transition-colors ${tool.key === current ? "border-brand-1/50 text-brand-2" : "border-border text-muted-foreground hover:text-foreground"}`}
        >
          {t(tool.key)}
        </Link>
      ))}
    </nav>
  );
}
