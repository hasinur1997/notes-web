import { Bell, X } from "lucide-react";
import { formatReminder, isOverdue } from "@/lib/reminders";

/**
 * Small chip showing a note's reminder; overdue reminders are shown in red and crossed out.
 *
 * @param {object} props
 * @param {string} props.value - Reminder time (ISO string).
 * @param {() => void} [props.onRemove] - Shows a remove button when provided.
 * @returns {JSX.Element}
 */
export function ReminderChip({ value, onRemove }) {
  const overdue = isOverdue(value);
  return (
    <span
      className={`inline-flex h-6 items-center gap-1 rounded-full border px-2 text-xs font-medium ${
        overdue ? "border-destructive/30 text-destructive" : "border-border text-foreground/80"
      }`}
    >
      <Bell className="size-3.5" aria-hidden="true" />
      <span className={overdue ? "line-through" : ""}>{formatReminder(value)}</span>
      <span className="sr-only">{overdue ? "(overdue)" : ""}</span>
      {onRemove && (
        <button type="button" onClick={onRemove} aria-label="Remove reminder" className="-mr-1 rounded-full p-0.5 hover:bg-foreground/10">
          <X className="size-3" aria-hidden="true" />
        </button>
      )}
    </span>
  );
}
