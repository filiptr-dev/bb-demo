"use client";

import { useFormatter, useTranslations } from "next-intl";
import { ArrowRight, ExternalLink, Phone } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { dims, type Product } from "@/lib/domain/product";
import { site } from "@/lib/site";
import ProductTypeImage from "@/components/product/ProductTypeImage";
import type { ShownEvent } from "@/hooks/useAssistantChat";

type Of<T extends ShownEvent["type"]> = Extract<ShownEvent, { type: T }>;
type Nav = { onNavigate: () => void };

const card = "rounded-xl border border-border bg-foreground/[0.02]";
const moreLink = "inline-flex items-center gap-1 text-xs font-semibold text-brand-2 hover:underline underline-offset-4";

function ProductRow({ p, onNavigate }: { p: Product } & Nav) {
  const tt = useTranslations("BearingTypes");
  return (
    <li className="flex items-center gap-3 px-3 py-2">
      <ProductTypeImage type={p.type} className="h-9 w-11 shrink-0 rounded-md" />
      <Link href={`/catalog/${p.slug}`} onClick={onNavigate} className="group min-w-0 flex-1">
        <span className="block truncate font-mono text-sm font-bold group-hover:text-brand-2">{p.designation}</span>
        <span className="block truncate text-xs text-foreground/50">
          {tt.has(`${p.type}.name`) ? tt(`${p.type}.name`) : p.type} · {dims(p)} mm
        </span>
      </Link>
    </li>
  );
}

export function ProductsCard({ event, onNavigate }: { event: Of<"products"> } & Nav) {
  const t = useTranslations("Assistant.products");
  return (
    <div className={card}>
      {event.total != null && event.search != null && (
        <p className="border-b border-border px-3 py-2 text-xs text-foreground/60">{t("found", { total: event.total, search: event.search })}</p>
      )}
      <ul className="divide-y divide-border">
        {event.products.map((p) => (
          <ProductRow key={p.slug} p={p} onNavigate={onNavigate} />
        ))}
      </ul>
      {event.search != null && event.total != null && event.total > event.products.length && (
        <div className="border-t border-border px-3 py-2">
          <Link href={{ pathname: "/catalog", query: { search: event.search } }} onClick={onNavigate} className={moreLink}>
            {t("showAll")} <ArrowRight className="size-3.5" />
          </Link>
        </div>
      )}
    </div>
  );
}

export function SpecsCard({ event, onNavigate }: { event: Of<"specs"> } & Nav) {
  const t = useTranslations("Assistant.specs");
  const tl = useTranslations("ProductDetail.specs");
  const tp = useTranslations("ProductDetail");
  const format = useFormatter();
  const { product: p, specs } = event;
  const num = (v: number | null, unit: string) => (v == null ? null : `${format.number(v)} ${unit}`);
  const rows: [string, string | null][] = [
    [tl("dInner"), num(p.d, "mm")],
    [tl("dOuter"), num(p.D, "mm")],
    [tl("width"), num(p.B, "mm")],
    ...(specs
      ? ([
          [tl("loadDynamic"), num(specs.c, "kN")],
          [tl("loadStatic"), num(specs.c0, "kN")],
          [tl("fatigueLimit"), num(specs.pu, "kN")],
          [tl("referenceSpeed"), num(specs.referenceSpeed, "r/min")],
          [tl("limitingSpeed"), num(specs.limitingSpeed, "r/min")],
          [tl("mass"), num(specs.mass, "kg")],
          [tl("performanceClass"), specs.performanceClass],
        ] satisfies [string, string | null][])
      : []),
  ];
  return (
    <div className={card}>
      <ul className="divide-y divide-border">
        <ProductRow p={p} onNavigate={onNavigate} />
      </ul>
      <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1.5 border-t border-border px-3 py-2.5 text-xs">
        {rows
          .filter((r): r is [string, string] => r[1] != null)
          .map(([label, value]) => (
            <div key={label} className="contents">
              <dt className="text-foreground/55">{label}</dt>
              <dd className="text-right font-mono font-medium">{value}</dd>
            </div>
          ))}
      </dl>
      {!specs && <p className="border-t border-border px-3 py-2 text-xs text-foreground/60">{t("noData")}</p>}
      <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-border px-3 py-2">
        <Link href={`/catalog/${p.slug}`} onClick={onNavigate} className={moreLink}>
          {t("productPage")} <ArrowRight className="size-3.5" />
        </Link>
        {specs?.sourceUrl && (
          <a href={specs.sourceUrl} target="_blank" rel="noopener noreferrer" className={moreLink}>
            {tp("datasheetLink")} <ExternalLink className="size-3.5" />
          </a>
        )}
      </div>
    </div>
  );
}

export function DecodeCard({ event, onNavigate }: { event: Of<"decode"> } & Nav) {
  const t = useTranslations("Decoder");
  const ta = useTranslations("Assistant.decode");
  const { decoded } = event;
  return (
    <div className={card}>
      <p className="border-b border-border px-3 py-2 font-mono text-sm font-bold">{decoded.designation}</p>
      <ul className="space-y-2 px-3 py-2.5">
        {decoded.segments.map((seg, i) => (
          <li key={i} className="flex items-start gap-2.5 text-xs">
            <span className="mt-px shrink-0 rounded-md bg-foreground/[0.07] px-1.5 py-0.5 font-mono">{seg.token}</span>
            <span className="text-foreground/70">
              <span className="mr-1.5 text-[10px] uppercase tracking-wider text-foreground/45">{t(`kinds.${seg.kind}`)}</span>
              {seg.id && t.has(`codes.${seg.id}`) ? t(`codes.${seg.id}`) : null}
              {seg.kind === "bore" && seg.boreMm != null && `${t("boreLabel")}: ${seg.boreMm} mm`}
            </span>
          </li>
        ))}
      </ul>
      <div className="border-t border-border px-3 py-2">
        <Link href="/decoder" onClick={onNavigate} className={moreLink}>
          {ta("openDecoder")} <ArrowRight className="size-3.5" />
        </Link>
      </div>
    </div>
  );
}

export function GreasesCard({ event, onNavigate }: { event: Of<"greases"> } & Nav) {
  const t = useTranslations("Assistant.greases");
  const tg = useTranslations("Greases.condition");
  return (
    <div className={card}>
      <p className="border-b border-border px-3 py-2 text-xs font-semibold">{t("heading")}</p>
      <ul className="divide-y divide-border">
        {event.basic.map((b) => (
          <li key={b.condition} className="flex items-baseline justify-between gap-3 px-3 py-2 text-xs">
            <span className="text-foreground/65">{tg.has(b.condition) ? tg(b.condition) : b.condition}</span>
            <span className="shrink-0 font-mono font-bold">SKF {b.code}</span>
          </li>
        ))}
      </ul>
      <div className="border-t border-border px-3 py-2">
        <Link href="/products/greases" onClick={onNavigate} className={moreLink}>
          {t("chart")} <ArrowRight className="size-3.5" />
        </Link>
      </div>
    </div>
  );
}

export function ContactCard({ onNavigate }: Nav) {
  const t = useTranslations("Assistant.contact");
  const tc = useTranslations("Common");
  return (
    <div className={card}>
      <p className="border-b border-border px-3 py-2 text-xs font-semibold">{t("heading")}</p>
      <ul className="space-y-1.5 px-3 py-2.5 text-xs">
        {site.phones.map((p) => (
          <li key={p.tel} className="flex items-center justify-between gap-3">
            <span className="text-foreground/65">
              {tc(`cities.${p.city}`)}
              {p.city === "skopje" && <span className="text-foreground/45"> · {tc("hours")}</span>}
            </span>
            <a href={`tel:${p.tel}`} className="inline-flex items-center gap-1.5 font-mono font-medium hover:text-brand-2">
              <Phone className="size-3" /> {p.label}
            </a>
          </li>
        ))}
        <li className="text-foreground/45">{t("phones")}</li>
      </ul>
      <div className="flex flex-wrap gap-2 border-t border-border px-3 py-2.5">
        <Link href="/contact" onClick={onNavigate} className="rounded-full bg-brand-gradient px-3.5 py-1.5 text-xs font-semibold text-white">
          {t("form")}
        </Link>
      </div>
    </div>
  );
}

export function SourcesList({ event }: { event: Of<"sources"> }) {
  const t = useTranslations("Assistant");
  return (
    <p className="text-xs text-foreground/55">
      {t("sources")}:{" "}
      {event.sources.map((s, i) => (
        <span key={s.url}>
          {i > 0 && ", "}
          <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-brand-2 underline-offset-4 hover:underline">
            {s.title}
          </a>
        </span>
      ))}
    </p>
  );
}
