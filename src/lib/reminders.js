/**
 * Reminder date helpers: quick presets and human-friendly labels.
 */

const TIME = new Intl.DateTimeFormat("en-GB", { hour: "numeric", minute: "2-digit", hour12: true });
const DAY_MONTH = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" });
const DAY_MONTH_YEAR = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });

/** Returns a copy of `date` set to the given local time. */
function atTime(date, hours, minutes = 0) {
  const result = new Date(date);
  result.setHours(hours, minutes, 0, 0);
  return result;
}

/** Calendar-day difference between two dates in local time. */
function dayDifference(from, to) {
  const start = atTime(from, 0);
  const end = atTime(to, 0);
  return Math.round((end - start) / 86_400_000);
}

/**
 * Quick reminder choices relative to now: later today (6 PM, only before 5 PM),
 * tomorrow 8 AM, and next Monday 8 AM.
 *
 * @param {Date} [now=new Date()] - Reference time (injectable for tests).
 * @returns {{ label: string, date: Date }[]} Presets in order.
 */
export function reminderPresets(now = new Date()) {
  const presets = [];
  if (now.getHours() < 17) presets.push({ label: "Later today", date: atTime(now, 18) });
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  presets.push({ label: "Tomorrow", date: atTime(tomorrow, 8) });
  const nextMonday = new Date(now);
  nextMonday.setDate(now.getDate() + ((8 - now.getDay()) % 7 || 7));
  presets.push({ label: "Next week", date: atTime(nextMonday, 8) });
  return presets;
}

/**
 * Formats a reminder for chips and menus: "Today, 6:00 pm", "Tomorrow, 8:00 am",
 * "12 Nov, 9:00 am", or with the year when it is not this year.
 *
 * @param {string | Date} value - Reminder time.
 * @param {Date} [now=new Date()] - Reference time (injectable for tests).
 * @returns {string} Label, or an empty string for invalid input.
 */
export function formatReminder(value, now = new Date()) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const time = TIME.format(date);
  const days = dayDifference(now, date);
  if (days === 0) return `Today, ${time}`;
  if (days === 1) return `Tomorrow, ${time}`;
  if (days === -1) return `Yesterday, ${time}`;
  const day = date.getFullYear() === now.getFullYear() ? DAY_MONTH.format(date) : DAY_MONTH_YEAR.format(date);
  return `${day}, ${time}`;
}

/**
 * Whether a reminder time has passed.
 *
 * @param {string | Date | null} value - Reminder time.
 * @param {Date} [now=new Date()] - Reference time.
 * @returns {boolean} True if set and in the past.
 */
export function isOverdue(value, now = new Date()) {
  return Boolean(value) && new Date(value).getTime() < now.getTime();
}

/**
 * Converts a Date to the value format of <input type="datetime-local"> (local time, minutes).
 *
 * @param {Date} date - Date to convert.
 * @returns {string} e.g. "2026-11-12T09:30".
 */
export function toDateTimeLocal(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
