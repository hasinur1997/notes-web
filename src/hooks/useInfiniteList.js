"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getCached, setCached } from "@/lib/queryCache";

/** Cache namespace for this hook: the loaded pages and meta of a list. */
const cacheKey = (key) => `infinite:${key}`;

/** Key and version share one string; the version part changes on reload only. */
const keyOf = (requestKey) => requestKey.slice(0, requestKey.lastIndexOf("#"));

/**
 * Loads a paginated API list one page at a time and keeps the pages loaded so far, for
 * infinite scrolling. A new `key` starts again from page 1; `reload()` re-fetches every page
 * already shown (so changes appear without losing the scroll position). Stale responses are
 * ignored, and items are de-duplicated by `_id` in case the list shifted between pages.
 * The pages loaded are cached for the session (lib/queryCache): coming back to a list shows the
 * same pages at once and refreshes all of them in the background.
 *
 * @template T
 * @param {string | null} key - Describes the list (filters, page size). `null` turns it off.
 * @param {(page: number, signal?: AbortSignal) => Promise<{ data: T[], meta: { totalPages: number, total: number } }>} fetchPage
 *   Loads one page (1-based).
 * @returns {{
 *   data: { data: T[], meta: object } | undefined, dataKey: string | null, error: Error | null,
 *   loading: boolean, reload: () => void, loadMore: () => Promise<void>, hasMore: boolean,
 *   loadingMore: boolean, loadMoreError: Error | null,
 * }}
 */
export function useInfiniteList(key, fetchPage) {
  const [version, setVersion] = useState(0);
  // Start from the cached pages of this list, if it was shown before in this session.
  const [state, setState] = useState(() => {
    const cached = key === null ? undefined : getCached(cacheKey(key));
    return cached ? { key: `${key}#0`, pages: cached.pages, meta: cached.meta, error: null } : { key: null, pages: [], meta: null, error: null };
  });
  const [more, setMore] = useState({ loading: false, error: null });
  const fetchRef = useRef(fetchPage);
  const stateRef = useRef(state);
  const loadingMoreRef = useRef(false);
  const requestKey = key === null ? null : `${key}#${version}`;

  useEffect(() => {
    fetchRef.current = fetchPage;
    stateRef.current = state;
  });

  // First load for a new key, or a reload of every page already shown for the same key.
  useEffect(() => {
    if (requestKey === null) return undefined;
    const controller = new AbortController();
    const previous = stateRef.current;
    const sameList = previous.key !== null && keyOf(previous.key) === keyOf(requestKey);
    const count = sameList ? Math.max(1, previous.pages.length) : 1;
    Promise.all(Array.from({ length: count }, (_, index) => fetchRef.current(index + 1, controller.signal))).then(
      (results) => {
        if (controller.signal.aborted) return;
        const meta = results.at(-1).meta;
        // Drop pages that no longer exist (e.g. after deleting notes).
        const pages = results.slice(0, Math.max(1, meta.totalPages)).map((result) => result.data);
        setState({ key: requestKey, pages, meta, error: null });
      },
      (error) => {
        if (controller.signal.aborted) return;
        setState((prev) => ({ ...(sameList ? prev : { pages: [], meta: null }), key: requestKey, error }));
      },
    );
    return () => controller.abort();
  }, [requestKey]);

  // Keep the cache in step with every loaded page (first load, reload and "load more").
  useEffect(() => {
    if (state.key !== null && state.meta && !state.error) setCached(cacheKey(keyOf(state.key)), { pages: state.pages, meta: state.meta });
  }, [state]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);

  /** Loads the next page, unless one is loading already or everything is shown. */
  const loadMore = useCallback(async () => {
    const current = stateRef.current;
    if (loadingMoreRef.current || !current.meta || current.pages.length >= current.meta.totalPages) return;
    loadingMoreRef.current = true;
    setMore({ loading: true, error: null });
    try {
      const result = await fetchRef.current(current.pages.length + 1);
      // Only append if the list is still the one this page belongs to.
      setState((prev) =>
        prev.key === current.key && prev.pages.length === current.pages.length
          ? { ...prev, pages: [...prev.pages, result.data], meta: result.meta }
          : prev,
      );
      setMore({ loading: false, error: null });
    } catch (error) {
      setMore({ loading: false, error });
    } finally {
      loadingMoreRef.current = false;
    }
  }, []);

  const seen = new Set();
  const items = state.pages.flat().filter((item) => !seen.has(item._id) && seen.add(item._id));
  const active = requestKey !== null && state.key !== null;

  return {
    data: active && state.meta ? { data: items, meta: state.meta } : undefined,
    dataKey: active ? keyOf(state.key) : null,
    error: state.key === requestKey ? state.error : null,
    loading: requestKey !== null && state.key !== requestKey,
    reload,
    loadMore,
    hasMore: Boolean(state.meta) && state.pages.length < state.meta.totalPages,
    loadingMore: more.loading,
    loadMoreError: more.error,
  };
}
