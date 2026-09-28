export const normalize = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]/g, "");

// "25x52x15" or "25 52 15" -> [25, 52, 15]; "25x52" -> [25, 52] (matches d and D)
export function parseDims(q: string): number[] | null {
  const m = q.trim().match(/^(\d+(?:[.,]\d+)?)\s*[x×*\s]\s*(\d+(?:[.,]\d+)?)(?:\s*[x×*\s]\s*(\d+(?:[.,]\d+)?))?$/i);
  if (!m) return null;
  return m.slice(1).filter(Boolean).map((n) => parseFloat(n.replace(",", ".")));
}
