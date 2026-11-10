"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Loads data from the API and re-loads whenever `key` changes.
 * Stale responses are cancelled with AbortController, so a slow old request can never
 * overwrite newer data. Loading is derived (the stored result belongs to another key),
 * which keeps state updates out of the effect body.
 *
 * @template T
 * @param {string} key - Serializable description of the request (e.g. a query string). Changing it triggers a fetch.
 * @param {(signal: AbortSignal) => Promise<T>} fetcher - Performs the request.
 * @returns {{ data: T | undefined, error: Error | null, loading: boolean, reload: () => void }}
 */
export function useApiQuery(key, fetcher) {
  const [version, setVersion] = useState(0);
  const [result, setResult] = useState({ key: null, data: undefined, error: null });
  const fetcherRef = useRef(fetcher);
  const requestKey = `${key}#${version}`;

  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  useEffect(() => {
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
    error: result.key === requestKey ? result.error : null,
    loading: result.key !== requestKey,
    reload,
  };
}
