/**
 * Small display helpers.
 */

const DATE_FORMAT = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });

/**
 * Formats a date as "10 Nov 2026".
 *
 * @param {string | Date} value - ISO string or Date.
 * @returns {string} Formatted date, or an empty string for invalid input.
 */
export function formatDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : DATE_FORMAT.format(date);
}

/**
 * Returns up to two initials from a name, e.g. "Hasinur Rahman" -> "HR".
 *
 * @param {string} [name=""] - Full name.
 * @returns {string} Uppercase initials, or "?" if the name is empty.
 */
export function getInitials(name = "") {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  const first = parts[0][0];
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return `${first}${last}`.toUpperCase();
}
