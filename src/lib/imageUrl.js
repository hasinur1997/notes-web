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

/**
 * Downloads an image as a File, so an already stored image can be cropped in the browser.
 * Works for Cloudinary and for images served by the API (both allow cross-origin reads).
 *
 * @param {string} url - Stored image URL (absolute or an /uploads path).
 * @returns {Promise<File>} The image file.
 * @throws {Error} If the image cannot be downloaded.
 */
export async function fetchImageFile(url) {
  // Bypass the HTTP cache: copies cached before the server sent CORS headers would be unreadable.
  const response = await fetch(resolveImageUrl(url), { cache: "no-store" });
  if (!response.ok) throw new Error("The image could not be loaded for cropping.");
  const blob = await response.blob();
  const name = decodeURIComponent(new URL(resolveImageUrl(url)).pathname.split("/").pop() || "image");
  return new File([blob], name, { type: blob.type || "image/jpeg" });
}
