import { useEffect, useState } from "react";
import { fetchProducts, type ProductPage } from "@/lib/api-client";

// Fetches /api/products for a query string (null = don't search). A newer query aborts the older request, and the
// previous results stay available until the new ones arrive, so lists can dim instead of flashing empty.
export function useProductSearch(query: string | null) {
  const [data, setData] = useState<(ProductPage & { query: string }) | null>(null);

  useEffect(() => {
    if (query === null) return;
    const ctl = new AbortController();
    fetchProducts(new URLSearchParams(query), ctl.signal)
      .then((d) => setData({ query, ...d }))
      .catch((e) => { if (e?.name !== "AbortError") setData({ query, rows: [], total: 0, page: 1 }); });
    return () => ctl.abort();
  }, [query]);

  return { data, loading: query !== null && data?.query !== query };
}
