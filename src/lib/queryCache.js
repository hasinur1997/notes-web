/**
 * In-memory cache of API responses for the current session, so going back to a page shows what
 * it showed last time at once (then refreshes it in the background) instead of a loading state.
 * It lives only in memory (gone on a full reload) and is cleared whenever the signed-in account
 * changes (lib/token.js), so one account never sees another's data.
 */

/** Most entries kept; the oldest are dropped first. */
const MAX_ENTRIES = 60;

const cache = new Map();
/** Server renders never read or fill the cache (it would be shared between visitors). */
const isBrowser = typeof window !== "undefined";

/**
 * Reads a cached response.
 *
 * @param {string} key - Query key (namespaced by the hook that stores it).
 * @returns {unknown} The cached value, or undefined.
 */
export function getCached(key) {
  return isBrowser ? cache.get(key) : undefined;
}

/**
 * Stores a response, replacing an older one for the same key.
 *
 * @param {string} key - Query key.
 * @param {unknown} value - Response to keep.
 * @returns {void}
 */
export function setCached(key, value) {
  if (!isBrowser) return;
  cache.delete(key);
  cache.set(key, value);
  if (cache.size > MAX_ENTRIES) cache.delete(cache.keys().next().value);
}

/**
 * Forgets every cached response (on sign-in, sign-out or an expired session).
 *
 * @returns {void}
 */
export function clearQueryCache() {
  cache.clear();
}
