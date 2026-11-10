/**
 * Roles shown in the admin area. The API decides what each role may do; this module only
 * describes them for people.
 */

/** Role choices with the wording used in forms and on the Roles & access page. */
export const ROLE_OPTIONS = [
  { value: "user", label: "User", description: "Manages their own notes, profile and settings." },
  { value: "admin", label: "Admin", description: "Everything a user can do, plus manage users and see all notes." },
];

/**
 * Whether the user has the admin role (for showing admin UI only; the API enforces access).
 *
 * @param {{ role?: string } | null | undefined} user - Signed-in user.
 * @returns {boolean} True for admins.
 */
export function isAdmin(user) {
  return user?.role === "admin";
}

/**
 * Role name for display.
 *
 * @param {string} role - "user" or "admin".
 * @returns {string} "User" or "Admin".
 */
export function roleLabel(role) {
  return ROLE_OPTIONS.find((option) => option.value === role)?.label ?? role;
}
