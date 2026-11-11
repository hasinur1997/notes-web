/**
 * Field checks for forms, so mistakes show as messages under the field instead of the browser's
 * built-in popups. They mirror the API's limits for quick feedback only: the API validates
 * every request again and stays the source of truth.
 * Each check returns an error message, or undefined when the value is fine.
 */

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const NAME_MAX = 100;
export const EMAIL_MAX = 254;
export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 72;

/**
 * @param {string} value - Full name.
 * @returns {string | undefined}
 */
export function checkName(value) {
  const name = value.trim();
  if (!name) return "Enter your name.";
  if (name.length > NAME_MAX) return `Use at most ${NAME_MAX} characters.`;
  return undefined;
}

/**
 * @param {string} value - Email address.
 * @returns {string | undefined}
 */
export function checkEmail(value) {
  const email = value.trim();
  if (!email) return "Enter your email address.";
  if (email.length > EMAIL_MAX || !EMAIL_PATTERN.test(email)) return "Enter a valid email address, like name@example.com.";
  return undefined;
}

/**
 * A new password (register, reset).
 *
 * @param {string} value - Password.
 * @returns {string | undefined}
 */
export function checkNewPassword(value) {
  if (!value) return "Enter a password.";
  if (value.length < PASSWORD_MIN) return `Use at least ${PASSWORD_MIN} characters.`;
  if (value.length > PASSWORD_MAX) return `Use at most ${PASSWORD_MAX} characters.`;
  return undefined;
}

/**
 * The password typed again.
 *
 * @param {string} password - The password.
 * @param {string} confirmation - The repeated password.
 * @returns {string | undefined}
 */
export function checkConfirmation(password, confirmation) {
  if (!confirmation) return "Type the password again.";
  if (confirmation !== password) return "Passwords do not match.";
  return undefined;
}

/**
 * Any field that only has to be filled in (e.g. the password when signing in).
 *
 * @param {string} value - Field value.
 * @param {string} message - Message when it is empty.
 * @returns {string | undefined}
 */
export function checkRequired(value, message) {
  return value ? undefined : message;
}
