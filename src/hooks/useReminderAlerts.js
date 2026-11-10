"use client";

import { useEffect } from "react";
import { toast } from "sonner";

/** Only reminders due within this window are scheduled (timers beyond it are not reliable anyway). */
const LOOKAHEAD_MS = 24 * 60 * 60 * 1000;

/**
 * Shows an in-app alert when a note's reminder time arrives while the app is open:
 * a toast, plus a browser notification if the user allowed notifications.
 *
 * @param {{ _id: string, title: string, reminderAt: string | null }[]} notes - Notes with reminders.
 * @returns {void}
 */
export function useReminderAlerts(notes) {
  useEffect(() => {
    const now = Date.now();
    const timers = notes
      .filter((note) => note.reminderAt)
      .map((note) => ({ note, delay: new Date(note.reminderAt).getTime() - now }))
      .filter(({ delay }) => delay > 0 && delay <= LOOKAHEAD_MS)
      .map(({ note, delay }) =>
        setTimeout(() => {
          toast(`Reminder: ${note.title}`, { duration: 10_000 });
          if (typeof Notification !== "undefined" && Notification.permission === "granted") {
            new Notification("Notes reminder", { body: note.title, tag: note._id });
          }
        }, delay),
      );
    return () => timers.forEach(clearTimeout);
  }, [notes]);
}
