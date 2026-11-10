/**
 * The user's app settings (stored on the account by the API) and the choices offered for them.
 */

/** Values used until the account's settings are known (the API fills the same defaults). */
export const DEFAULT_SETTINGS = Object.freeze({ notesPagination: "pages", notesPerPage: 12 });

/** How the notes list is paged. */
export const PAGINATION_OPTIONS = [
  { value: "pages", label: "Page numbers", description: "Browse notes in pages: 1, 2, 3, 4…" },
  { value: "infinite", label: "Infinite scroll", description: "More notes load automatically as you scroll down." },
];

/** Notes loaded per page or per scroll batch (multiples of 12 fill 2, 3 or 4 columns evenly). */
export const PER_PAGE_OPTIONS = [12, 24, 48];

/**
 * The user's settings with defaults for anything missing.
 *
 * @param {{ settings?: object } | null | undefined} user - Signed-in user.
 * @returns {{ notesPagination: "pages" | "infinite", notesPerPage: number }} Complete settings.
 */
export function getSettings(user) {
  return { ...DEFAULT_SETTINGS, ...user?.settings };
}
