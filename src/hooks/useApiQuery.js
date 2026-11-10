"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Loads data from the API and re-loads whenever `key` changes.
 * Stale responses are cancelled with AbortController, so a slow old request can never
 * overwrite newer data. Loading is derived (the stored result belongs to another key),
 * which keeps state updates out of the effect body.
 *
 * @template T
 * @param {string | null} key - Serializable description of the request (e.g. a query string). Changing it
 *   triggers a fetch; `null` turns the query off.
 * @param {(signal: AbortSignal) => Promise<T>} fetcher - Performs the request.
 * @returns {{ data: T | undefined, dataKey: string | null, error: Error | null, loading: boolean, reload: () => void }}
 *   `dataKey` is the key the current data was loaded for (unchanged by reloads), e.g. to animate a new list in.
 */
export function useApiQuery(key, fetcher) {
  const [version, setVersion] = useState(0);
  const [result, setResult] = useState({ key: null, data: undefined, error: null });
  const fetcherRef = useRef(fetcher);
  const requestKey = key === null ? null : `${key}#${version}`;

  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  useEffect(() => {
    if (requestKey === null) return undefined;
    const controller = new AbortController();
    fetcherRef.current(controller.signal).then(
      (data) => {
        if (!controller.signal.aborted) setResult({ key: requestKey, data, error: null });
      },
      (error) => {
        if (!controller.signal.aborted) setResult((prev) => ({ key: requestKey, data: prev.data, error }));
      },
    );
    return () => controller.abort();
  }, [requestKey]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);

  return {
    data: result.data,
    dataKey: result.key === null ? null : result.key.slice(0, result.key.lastIndexOf("#")),
    error: result.key === requestKey ? result.error : null,
    loading: requestKey !== null && result.key !== requestKey,
    reload,
  };
}
