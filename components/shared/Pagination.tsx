import { Button } from "@/components/ui/button";

// 1 … 4 5 6 … 20 — always the first and last page, plus the current one's neighbours.
export function pageNumbers(cur: number, pages: number): (number | "…")[] {
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);
  const out: (number | "…")[] = [1];
  if (cur > 3) out.push("…");
  for (let i = Math.max(2, cur - 1); i <= Math.min(pages - 1, cur + 1); i++) out.push(i);
  if (cur < pages - 2) out.push("…");
  out.push(pages);
  return out;
}

export default function Pagination({ page, pages, onPage, labels }: {
  page: number;
  pages: number;
  onPage: (n: number) => void;
  labels: { nav: string; prev: string; next: string };
}) {
  if (pages <= 1) return null;
  return (
    <nav aria-label={labels.nav} className="flex items-center justify-center gap-2 mt-6">
      <Button variant="outline" size="icon" disabled={page === 1} onClick={() => onPage(page - 1)} aria-label={labels.prev}>‹</Button>
      {pageNumbers(page, pages).map((n, i) =>
        n === "…" ? (
          <span key={`d${i}`} className="px-1 text-foreground/30">…</span>
        ) : (
          <Button key={n} size="icon" variant="outline" onClick={() => onPage(n)} aria-current={n === page} className={n === page ? "bg-brand-gradient text-white border-transparent hover:opacity-90" : ""}>{n}</Button>
        )
      )}
      <Button variant="outline" size="icon" disabled={page === pages} onClick={() => onPage(page + 1)} aria-label={labels.next}>›</Button>
    </nav>
  );
}
