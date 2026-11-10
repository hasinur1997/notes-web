/**
 * Search helpers shared by the notes list: the words a search is made of (the same rule the
 * API uses to match notes) and highlighting of those words in note text.
 */

/** Most words a search uses (the API ignores the rest). */
export const MAX_SEARCH_WORDS = 8;

/** Highlight for a matched word; legible on every note colour. */
const MARK_CLASS = "rounded-[3px] bg-primary/50 px-px text-inherit";

/**
 * Splits a search into distinct words (case-insensitive), in order.
 *
 * @param {string | null | undefined} q - Search text.
 * @returns {string[]} Words, at most MAX_SEARCH_WORDS.
 */
export function searchWords(q) {
  const seen = new Set();
  return (q ?? "")
    .split(/\s+/)
    .filter((word) => word && !seen.has(word.toLowerCase()) && seen.add(word.toLowerCase()))
    .slice(0, MAX_SEARCH_WORDS);
}

/** Escapes text for use inside a RegExp. */
const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Builds one case-insensitive pattern matching any of the words, longest first so that
 * overlapping words ("note", "notes") highlight the longer match.
 *
 * @param {string[]} words - Search words.
 * @returns {RegExp | null} Global pattern with one capture group, or null when there are no words.
 */
export function highlightPattern(words) {
  if (!words?.length) return null;
  const alternatives = [...words].sort((a, b) => b.length - a.length).map(escapeRegExp);
  return new RegExp(`(${alternatives.join("|")})`, "gi");
}

/**
 * Wraps every match of `pattern` in `text` in a <mark>. Text is never parsed as HTML.
 *
 * @param {string} text - Plain text.
 * @param {RegExp | null} pattern - From highlightPattern.
 * @param {string} [keyPrefix=""] - Makes keys unique when called several times in one parent.
 * @returns {React.ReactNode} The text, with matches marked.
 */
export function highlightText(text, pattern, keyPrefix = "") {
  if (!pattern || !text) return text;
  // split() with a capture group keeps the matches at the odd indexes.
  const parts = text.split(pattern);
  if (parts.length === 1) return text;
  return parts.map((part, index) =>
    index % 2 === 1 ? (
      <mark key={`${keyPrefix}${index}`} className={MARK_CLASS}>
        {part}
      </mark>
    ) : (
      part
    ),
  );
}
