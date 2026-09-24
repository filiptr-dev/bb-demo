import { Product, getType, getIndustry } from "./data";

export const normalize = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]/g, "");

// "25x52x15" or "25 52 15" -> [25, 52, 15]; "25x52" -> [25, 52] (matches d and D)
export function parseDims(q: string): number[] | null {
  const m = q.trim().match(/^(\d+(?:[.,]\d+)?)\s*[x×*\s]\s*(\d+(?:[.,]\d+)?)(?:\s*[x×*\s]\s*(\d+(?:[.,]\d+)?))?$/i);
  if (!m) return null;
  return m.slice(1).filter(Boolean).map((n) => parseFloat(n.replace(",", ".")));
}

const words = (p: Product) => {
  const t = getType(p.type);
  const inds = p.industries.map((s) => getIndustry(s)).flatMap((i) => (i ? [i.name, i.nameEn] : []));
  return [p.brand, t?.name, t?.short, p.seal, p.boreType, ...inds].join(" ").toLowerCase();
};

export function score(p: Product, q: string): number {
  const dims = parseDims(q);
  if (dims) {
    const target = [p.d, p.D, p.B];
    return dims.every((v, i) => v === target[i]) ? 50 : 0;
  }

  const nq = normalize(q);
  const tokens = q.toLowerCase().split(/\s+/).filter(Boolean);
  if (!tokens.length) return 1;

  let best = 0;
  if (nq) {
    const key = normalize(p.designation);
    if (key === nq) best = 100;
    else if (key.startsWith(nq)) best = 80 - Math.min(key.length - nq.length, 20);
    else if (key.includes(nq)) best = 60;
    // a bare number also matches a dimension: "25" -> bore 25 mm
    if (/^\d+(?:[.,]\d+)?$/.test(q.trim())) {
      const n = parseFloat(q.replace(",", "."));
      if (p.d === n) best = Math.max(best, 40);
      else if (p.D === n || p.B === n) best = Math.max(best, 30);
    }
  }
  if (best === 0) {
    const hay = words(p);
    if (tokens.every((t) => hay.includes(t))) best = 10;
  }
  return best;
}

export function searchProducts(list: Product[], q: string): Product[] {
  return list
    .map((p) => ({ p, s: score(p, q) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s || a.p.designation.localeCompare(b.p.designation, "en", { numeric: true }))
    .map((x) => x.p);
}
