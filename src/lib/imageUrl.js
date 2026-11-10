/**
 * Image URL helpers. The API returns either an absolute Cloudinary URL or, when images are
 * stored on the API server, a relative path like "/uploads/notes/<user>/<file>.png".
 */

/** Origin of the API server (e.g. "http://localhost:5001"), derived from NEXT_PUBLIC_API_URL. */
const API_ORIGIN = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_API_URL).origin;
  } catch {
    return "";
  }
})();

/** The only host next/image is configured to optimize (see next.config.mjs). */
const OPTIMIZED_HOST = "res.cloudinary.com";

/**
 * Turns a stored image URL into one the browser can load.
 *
 * @param {string} url - Absolute URL, blob: preview, or a path on the API server.
 * @returns {string} Absolute URL.
 */
export function resolveImageUrl(url) {
  if (!url) return "";
  if (/^(https?:|blob:)/.test(url)) return url;
  return `${API_ORIGIN}${url.startsWith("/") ? "" : "/"}${url}`;
}

/**
 * Whether next/image should optimize this image. Images served by the API server itself
 * (often localhost or a private address in development) are shown as-is.
 *
 * @param {string} url - Absolute image URL.
 * @returns {boolean} True for Cloudinary images.
 */
export function canOptimizeImage(url) {
  try {
    return new URL(url).hostname === OPTIMIZED_HOST;
  } catch {
    return false;
  }
}
