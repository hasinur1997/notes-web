"use client";

import { useApiQuery } from "@/hooks/useApiQuery";
import { useInfiniteList } from "@/hooks/useInfiniteList";

/**
 * A paginated API list that follows the user's pagination setting: one page at a time
 * (`page` from the URL) or infinite scroll (pages appended as the user scrolls). Only one of
 * the two underlying queries runs.
 *
 * @template T
 * @param {object} options
 * @param {string | null} options.key - Describes the list (filters and page size); null turns it off.
 * @param {(page: number, signal?: AbortSignal) => Promise<{ data: T[], meta: object }>} options.fetchPage - Loads one page.
 * @param {boolean} options.infinite - Infinite scroll instead of page numbers.
 * @param {number} options.page - Current page in page-number mode.
 * @returns {{ data: { data: T[], meta: object } | undefined, dataKey: string | null, error: Error | null,
 *   loading: boolean, reload: () => void, hasMore: boolean, loadMore: () => Promise<void>,
 *   loadingMore: boolean, loadMoreError: Error | null }}
 */
export function usePagedList({ key, fetchPage, infinite, page }) {
  const paged = useApiQuery(key !== null && !infinite ? `${key}&page=${page}` : null, (signal) => fetchPage(page, signal));
  const scrolled = useInfiniteList(key !== null && infinite ? key : null, fetchPage);
  if (infinite) return scrolled;
  return { ...paged, hasMore: false, loadMore: async () => {}, loadingMore: false, loadMoreError: null };
}
