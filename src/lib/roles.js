/**
 * Roles shown in the admin area. The API decides what each role may do; this module only
 * describes it for people.
 */

/** Role choices with the wording used in forms and on the Roles & access page. */
export const ROLE_OPTIONS = [
  { value: "user", label: "User", description: "Manages their own notes, profile and settings." },
  { value: "admin", label: "Admin", description: "Everything a user can do, plus manage users and see all notes." },
];

/**
 * What each role can do, grouped for the permissions table. `admin` may be `true`, `false` or
 * a short qualifier string such as "Yes, read only".
 */
export const PERMISSIONS = [
  {
    group: "Notes",
    rows: [
      { label: "Create, edit and delete their own notes", user: true, admin: true },
      { label: "Read their own notes and notes shared with them", user: true, admin: true },
      { label: "Share their notes with other people", user: true, admin: true },
      { label: "Read everyone's notes", user: false, admin: "Yes, read only" },
    ],
  },
  {
    group: "People",
    rows: [
      { label: "Edit their own name, photo and interests", user: true, admin: true },
      { label: "Create, edit and delete users", user: false, admin: true },
      { label: "Change a person's role", user: false, admin: true },
    ],
  },
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
