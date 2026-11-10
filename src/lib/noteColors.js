/**
 * Note background colours. Keys match the API's `color` values; classes come from the
 * --note-* theme tokens in globals.css, so colours are defined in one place.
 */

/** @type {{ key: string, label: string, className: string }[]} */
export const NOTE_COLORS = [
  { key: "default", label: "Default", className: "bg-note-default" },
  { key: "amber", label: "Amber", className: "bg-note-amber" },
  { key: "coral", label: "Coral", className: "bg-note-coral" },
  { key: "rose", label: "Rose", className: "bg-note-rose" },
  { key: "lavender", label: "Lavender", className: "bg-note-lavender" },
  { key: "sky", label: "Sky", className: "bg-note-sky" },
  { key: "mint", label: "Mint", className: "bg-note-mint" },
  { key: "sand", label: "Sand", className: "bg-note-sand" },
];

const BY_KEY = new Map(NOTE_COLORS.map((color) => [color.key, color]));

/**
 * Returns the background class for a colour key (falls back to the default white).
 *
 * @param {string | undefined} key - Colour key from a note.
 * @returns {string} Tailwind class, e.g. "bg-note-sky".
 */
export function noteColorClass(key) {
  return (BY_KEY.get(key) ?? BY_KEY.get("default")).className;
}
