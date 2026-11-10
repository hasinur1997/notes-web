/**
 * Access-token storage in localStorage.
 * Only call these from effects or event handlers (never during render) to avoid hydration mismatches.
 * Every access is wrapped in try/catch because storage can be unavailable (private mode, blocked site data).
 */

const TOKEN_KEY = "notes.token";

/**
 * Reads the stored access token.
 *
 * @returns {string | null} The token, or null if none is stored or storage is unavailable.
 */
export function getToken() {
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

/**
 * Stores the access token.
 *
 * @param {string} token - JWT returned by the API.
 * @returns {void}
 */
export function setToken(token) {
  try {
    window.localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // Storage unavailable: the session lasts only until the page is reloaded.
  }
}

/**
 * Removes the stored access token.
 *
 * @returns {void}
 */
export function clearToken() {
  try {
    window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Nothing to clear.
  }
}
