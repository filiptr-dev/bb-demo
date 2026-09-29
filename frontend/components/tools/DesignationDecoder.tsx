"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useDebounced } from "@/hooks/useDebounced";
import { useDecodedDesignation } from "@/hooks/useDecodedDesignation";
import type { Segment } from "@/lib/api/decoder";

const kindVariant: Record<Segment["kind"], "default" | "secondary" | "outline"> = {
  prefix: "secondary",
  series: "default",
  bore: "default",
  suffix: "secondary",
  unknown: "outline",
};

export default function DesignationDecoder() {
  const t = useTranslations("Decoder");
  const ta = useTranslations("Errors.actions");
  const [value, setValue] = useState("");
  const trimmed = value.trim();
  // decoded by the API, 300 ms after typing stops; the last result stays (dimmed) until the next one arrives
  const query = useDebounced(trimmed || null, 300);
  const { data, loading, error, retry } = useDecodedDesignation(trimmed ? query : null);
  const result = trimmed ? data : null;
  const pending = loading || query !== trimmed;

  return (
    <div>
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={t("placeholder")}
        aria-label={t("title")}
        className="h-12 rounded-xl px-4 text-lg font-mono"
        autoComplete="off"
        spellCheck={false}
      />

      <div className="mt-8 min-h-[8rem]">
        {!trimmed && <p className="text-sm text-muted-foreground">{t("empty")}</p>}

        {trimmed && error && (
          <div role="alert" className="text-sm">
            <p className="text-foreground/70">{t("error")}</p>
            <Button type="button" size="sm" variant="outline" onClick={retry} className="mt-2 rounded-full">
              {ta("retry")}
            </Button>
          </div>
        )}

        {!error && result != null && !result.segments.length && !pending && (
          <p className="text-sm text-muted-foreground">{t("notFound")}</p>
        )}

        {!error && result != null && result.segments.length > 0 && (
          <div className={`space-y-6 transition-opacity ${pending ? "opacity-50" : ""}`} aria-busy={pending}>
            <div className="flex flex-wrap gap-2 font-mono text-lg">
              {result.segments.map((seg, i) => (
                <Badge key={i} variant={kindVariant[seg.kind]} className="h-auto px-3 py-1.5 text-sm">
                  {seg.token}
                </Badge>
              ))}
            </div>

            {result.boreMm != null && (
              <p className="text-sm">
                <span className="text-muted-foreground">{t("boreLabel")}: </span>
                <span className="font-semibold">{result.boreMm} mm</span>
              </p>
            )}

            <ul className="space-y-3 border-t border-border pt-5">
              {result.segments.map((seg, i) => (
                <li key={i} className="flex items-start gap-3 text-sm">
                  <span className="mt-0.5 shrink-0 rounded-md bg-muted px-2 py-0.5 font-mono text-xs">{seg.token}</span>
                  <span className="text-muted-foreground">
                    <span className="mr-2 text-[10px] uppercase tracking-wider text-foreground/50">{t(`kinds.${seg.kind}`)}</span>
                    {seg.id && t(`codes.${seg.id}`)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
