import { useCallback, useEffect, useState } from "react";
import { fetchProducts, type ProductPage } from "@/lib/api/search";

// Searches the API (GET /api/v1/products) for a catalog query string (null = don't search). A newer query aborts the older request, and the
// previous results stay available until the new ones arrive, so lists can dim instead of flashing empty.
// A failed request sets `error` (instead of pretending there were no results); `retry` re-runs the same query.
export function useProductSearch(query: string | null) {
  const [data, setData] = useState<(ProductPage & { query: string }) | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (query === null) return;
    const ctl = new AbortController();
    fetchProducts(new URLSearchParams(query), ctl.signal)
      .then((d) => { setData({ query, ...d }); setFailed(null); })
      .catch((e) => { if (e?.name !== "AbortError") setFailed(query); });
    return () => ctl.abort();
  }, [query, attempt]);

  const error = query !== null && failed === query;
  const retry = useCallback(() => { setFailed(null); setAttempt((n) => n + 1); }, []);

  return { data, loading: query !== null && data?.query !== query && !error, error, retry };
}
