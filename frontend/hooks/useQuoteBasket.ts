import { useSyncExternalStore } from "react";

export type QuoteItem = { slug: string; designation: string; qty: number };

// The quote basket lives in this browser's localStorage; every component using the hook re-renders on change,
// and other tabs follow via the storage event.
const KEY = "quote-basket";
export const MAX_ITEMS = 100;
export const MAX_QTY = 100000;
const listeners = new Set<() => void>();
let cache: QuoteItem[] | undefined;

const valid = (i: QuoteItem) => typeof i?.slug === "string" && typeof i.designation === "string" && Number.isInteger(i.qty) && i.qty > 0;

function read(): QuoteItem[] {
  if (cache) return cache;
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    cache = Array.isArray(v) ? v.filter(valid).slice(0, MAX_ITEMS) : [];
  } catch {
    cache = [];
  }
  return cache;
}

function write(next: QuoteItem[]) {
  cache = next;
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* storage blocked: basket lasts for this page view */ }
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  const onStorage = (e: StorageEvent) => { if (e.key === KEY) { cache = undefined; l(); } };
  listeners.add(l);
  window.addEventListener("storage", onStorage);
  return () => { listeners.delete(l); window.removeEventListener("storage", onStorage); };
}

const clampQty = (n: number) => Math.min(MAX_QTY, Math.max(1, Math.round(n) || 1));

export const quoteBasket = {
  add: (p: { slug: string; designation: string }) =>
    read().some((i) => i.slug === p.slug) || read().length >= MAX_ITEMS ? undefined : write([...read(), { slug: p.slug, designation: p.designation, qty: 1 }]),
  remove: (slug: string) => write(read().filter((i) => i.slug !== slug)),
  setQty: (slug: string, qty: number) => write(read().map((i) => (i.slug === slug ? { ...i, qty: clampQty(qty) } : i))),
  clear: () => write([]),
};

// null during SSR and hydration (the basket is unknown there), then the stored items.
export function useQuoteBasket(): QuoteItem[] | null {
  return useSyncExternalStore(subscribe, read, () => null);
}
