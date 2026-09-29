import { useCallback, useEffect, useState } from "react";
import { decodeDesignation, type DecodedDesignation } from "@/lib/api/decoder";

// Decodes a designation through the API (null = nothing to decode). Like useProductSearch: a newer value aborts the
// older request, the previous result stays until the new one arrives, and a failure sets `error` with a `retry`.
export function useDecodedDesignation(designation: string | null) {
  const [data, setData] = useState<{ query: string; result: DecodedDesignation } | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (designation === null) return;
    const ctl = new AbortController();
    decodeDesignation(designation, ctl.signal)
      .then((result) => { setData({ query: designation, result }); setFailed(null); })
      .catch((e) => { if (e?.name !== "AbortError") setFailed(designation); });
    return () => ctl.abort();
  }, [designation, attempt]);

  const error = designation !== null && failed === designation;
  const retry = useCallback(() => { setFailed(null); setAttempt((n) => n + 1); }, []);

  return { data: data?.result ?? null, loading: designation !== null && data?.query !== designation && !error, error, retry };
}
