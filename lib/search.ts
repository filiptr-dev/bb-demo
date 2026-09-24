import { Product } from "./data";

export const normalize = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]/g, "");

// "25x52x15" or "25 52 15" -> [25, 52, 15]
export function parseDims(q: string): number[] | null {
  const m = q.trim().match(/^(\d+(?:[.,]\d+)?)\s*[x×*\s]\s*(\d+(?:[.,]\d+)?)(?:\s*[x×*\s]\s*(\d+(?:[.,]\d+)?))?$/i);
  if (!m) return null;
  return m.slice(1).filter(Boolean).map((n) => parseFloat(n.replace(",", ".")));
}

export function score(p: Product, q: string): number {
  const dims = parseDims(q);
  if (dims) {
    const target = [p.d, p.D, p.B];
    return dims.every((v, i) => v === target[i]) ? 50 : 0;
  }
  const nq = normalize(q);
  if (!nq) return 1;
  const key = normalize(p.designation);
  if (key === nq) return 100;
  if (key.startsWith(nq)) return 80 - Math.min(key.length - nq.length, 20);
  if (key.includes(nq)) return 60;
  const text = normalize(`${p.brand}${p.type}${p.description}`);
  return text.includes(nq) ? 10 : 0;
}

export function searchProducts(list: Product[], q: string): Product[] {
  return list
    .map((p) => ({ p, s: score(p, q) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s || a.p.designation.localeCompare(b.p.designation, "en", { numeric: true }))
    .map((x) => x.p);
}
