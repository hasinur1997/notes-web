/**
 * Helpers for turning editor values into API payloads.
 */

const MAX_TITLE_LENGTH = 200;

/** Editor fields that are saved with the note (images and collaborators have their own endpoints). */
export const DRAFT_FIELDS = ["title", "content", "labels", "pinned", "color", "reminderAt"];

/** Empty values for a new note. */
export const EMPTY_DRAFT = Object.freeze({
  title: "",
  content: "",
  labels: [],
  pinned: false,
  color: "default",
  reminderAt: null,
});

/**
 * Picks the editable fields of a note as editor values.
 *
 * @param {object} note - Note from the API.
 * @returns {{ title: string, content: string, labels: string[], pinned: boolean, color: string, reminderAt: string | null }}
 */
export function draftFromNote(note) {
  return {
    title: note.title ?? "",
    content: note.content ?? "",
    labels: note.labels ?? [],
    pinned: Boolean(note.pinned),
    color: note.color ?? "default",
    reminderAt: note.reminderAt ?? null,
  };
}

/**
 * Normalizes title and text for saving. The API requires a title, so when only text was typed,
 * its first line becomes the title and the remaining lines stay as the text.
 *
 * @param {{ title: string, content: string }} values - Editor values.
 * @param {string} [fallbackTitle=""] - Title to use when there is no title and no text (e.g. the previous title).
 * @returns {{ title: string, content: string } | null} Title and text, or null when everything is empty.
 */
export function normalizeTitleAndContent({ title, content }, fallbackTitle = "") {
  const cleanTitle = title.trim();
  const cleanContent = content.trim();
  if (cleanTitle) return { title: cleanTitle.slice(0, MAX_TITLE_LENGTH), content: cleanContent };
  if (!cleanContent) return fallbackTitle ? { title: fallbackTitle, content: "" } : null;

  const [firstLine, ...rest] = cleanContent.split("\n");
  // Strip Markdown heading/list markers from the line used as a title.
  const plain = firstLine.replace(/^(#{1,2}\s+|[-*]\s+|\d+[.)]\s+)/, "").trim();
  const overflow = plain.slice(MAX_TITLE_LENGTH);
  return { title: plain.slice(0, MAX_TITLE_LENGTH), content: [overflow, ...rest].join("\n").trim() };
}

/**
 * Lists the fields that differ between two drafts (labels compared by value).
 *
 * @param {object} before - Original values.
 * @param {object} after - Edited values.
 * @returns {object} Only the changed fields.
 */
export function changedFields(before, after) {
  const changes = {};
  for (const field of DRAFT_FIELDS) {
    const same = Array.isArray(before[field])
      ? JSON.stringify(before[field]) === JSON.stringify(after[field])
      : before[field] === after[field];
    if (!same) changes[field] = after[field];
  }
  return changes;
}
