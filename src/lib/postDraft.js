/**
 * Helpers for turning post editor values into API payloads. Posts share the note editor, so the
 * editor values also carry the note-only fields (empty and never sent).
 */

/** Editor fields that are saved with a post (images have their own endpoints). */
export const POST_FIELDS = ["title", "content", "color"];

/** Empty values for a new post. labels / pinned / reminderAt are only there because the shared editor reads them. */
export const EMPTY_POST_DRAFT = Object.freeze({
  title: "",
  content: "",
  color: "default",
  labels: [],
  pinned: false,
  reminderAt: null,
});

/**
 * Editor values for an existing post.
 *
 * @param {object} post - Post from the API.
 * @returns {object} Editor values.
 */
export function draftFromPost(post) {
  return { ...EMPTY_POST_DRAFT, title: post.title ?? "", content: post.content ?? "", color: post.color ?? "default" };
}

/**
 * Picks the fields the API accepts for a post.
 *
 * @param {object} values - Editor values.
 * @returns {{ title: string, content: string, color: string }}
 */
export function pickPostFields(values) {
  return Object.fromEntries(POST_FIELDS.map((field) => [field, values[field]]));
}

/**
 * Lists the post fields that differ between two drafts.
 *
 * @param {object} before - Original values.
 * @param {object} after - Edited values.
 * @returns {object} Only the changed fields.
 */
export function changedPostFields(before, after) {
  return Object.fromEntries(POST_FIELDS.filter((field) => before[field] !== after[field]).map((field) => [field, after[field]]));
}
