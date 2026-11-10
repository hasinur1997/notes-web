/**
 * Applies Markdown formatting to a textarea's value at the current selection.
 * Pure functions: given text and a selection, they return the new text and selection.
 */

/** Inline formats wrap the selection with a marker on both sides. */
const INLINE_MARKERS = { bold: "**", italic: "_", underline: "++", strike: "~~" };

/** Line formats add (or remove) a prefix on every selected line. */
const LINE_PREFIXES = { h1: "# ", h2: "## ", bullet: "- ", numbered: "1. " };
const ANY_PREFIX = /^(#{1,2}\s+|[-*]\s+|\d+[.)]\s+)/;

/** All formats the toolbar offers. */
export const FORMATS = Object.freeze([...Object.keys(INLINE_MARKERS), ...Object.keys(LINE_PREFIXES)]);

/**
 * Wraps (or unwraps) the selection with an inline marker. With no selection, inserts an
 * empty pair and places the cursor between the markers.
 */
function toggleInline(value, start, end, marker) {
  const selected = value.slice(start, end);
  const before = value.slice(start - marker.length, start);
  const after = value.slice(end, end + marker.length);

  if (before === marker && after === marker) {
    // Already formatted: remove the markers.
    const next = value.slice(0, start - marker.length) + selected + value.slice(end + marker.length);
    return { value: next, start: start - marker.length, end: end - marker.length };
  }
  const next = value.slice(0, start) + marker + selected + marker + value.slice(end);
  return { value: next, start: start + marker.length, end: end + marker.length };
}

/**
 * Adds a line prefix to every line touched by the selection, or removes it if all of them
 * already have it. Numbered lists are renumbered 1, 2, 3…
 */
function toggleLinePrefix(value, start, end, format) {
  const lineStart = value.lastIndexOf("\n", start - 1) + 1;
  const nextBreak = value.indexOf("\n", end);
  const lineEnd = nextBreak === -1 ? value.length : nextBreak;
  const lines = value.slice(lineStart, lineEnd).split("\n");
  const prefix = LINE_PREFIXES[format];
  const has = (line) => (format === "numbered" ? /^\d+[.)]\s+/.test(line) : line.startsWith(prefix));
  const removing = lines.every(has);

  const updated = lines.map((line, i) => {
    const bare = line.replace(ANY_PREFIX, "");
    if (removing) return bare;
    return (format === "numbered" ? `${i + 1}. ` : prefix) + bare;
  });

  const replacement = updated.join("\n");
  const next = value.slice(0, lineStart) + replacement + value.slice(lineEnd);
  return { value: next, start: lineStart, end: lineStart + replacement.length };
}

/**
 * Applies a format to text at a selection.
 *
 * @param {string} value - Current text.
 * @param {number} start - Selection start.
 * @param {number} end - Selection end.
 * @param {string} format - One of FORMATS (bold, italic, underline, strike, h1, h2, bullet, numbered).
 * @returns {{ value: string, start: number, end: number }} New text and selection.
 */
export function applyFormat(value, start, end, format) {
  if (INLINE_MARKERS[format]) return toggleInline(value, start, end, INLINE_MARKERS[format]);
  if (LINE_PREFIXES[format]) return toggleLinePrefix(value, start, end, format);
  return { value, start, end };
}
