"use client";

import { useState } from "react";
import { BellPlus, CalendarClock, X } from "lucide-react";
import { TOOLBAR_TRIGGER_CLASS } from "@/components/notes/editor/ToolbarButton";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatReminder, reminderPresets, toDateTimeLocal } from "@/lib/reminders";

const ITEM_CLASS = "h-10 gap-2 rounded-lg px-2 text-[15px]";

/** Asks once for permission to show reminder notifications while the app is open. */
function requestNotificationPermission() {
  if (typeof Notification !== "undefined" && Notification.permission === "default") {
    Notification.requestPermission().catch(() => {});
  }
}

/**
 * "Remind me" menu: quick presets, a custom date and time, or remove the reminder.
 *
 * @param {object} props
 * @param {string | null} props.value - Current reminder (ISO string) or null.
 * @param {(iso: string | null) => void} props.onChange - Called with the new reminder or null.
 * @returns {JSX.Element}
 */
export function ReminderMenu({ value, onChange }) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [custom, setCustom] = useState("");
  // Time the picker was opened; custom reminders must be later than this.
  const [openedAt, setOpenedAt] = useState(0);

  /** Saves a reminder and asks for notification permission the first time. */
  function choose(date) {
    requestNotificationPermission();
    onChange(date.toISOString());
  }

  /** Opens the date/time picker, starting from the current reminder or one hour from now. */
  function openPicker() {
    const now = Date.now();
    const start = value && new Date(value).getTime() > now ? new Date(value) : new Date(now + 3_600_000);
    setOpenedAt(now);
    setCustom(toDateTimeLocal(start));
    setPickerOpen(true);
  }

  const customDate = custom ? new Date(custom) : null;
  const customValid = customDate && !Number.isNaN(customDate.getTime()) && customDate.getTime() > openedAt;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger aria-label="Remind me" title="Remind me" className={TOOLBAR_TRIGGER_CLASS}>
          <BellPlus className="size-[18px]" aria-hidden="true" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64 rounded-2xl border border-border p-2 ring-0">
          {/* Base UI requires a group label to live inside a Menu.Group. */}
          <DropdownMenuGroup>
            <DropdownMenuLabel className="px-2 pb-1 text-[13px] font-semibold text-muted-foreground">Remind me</DropdownMenuLabel>
            {reminderPresets().map((preset) => (
              <DropdownMenuItem key={preset.label} onClick={() => choose(preset.date)} className={`${ITEM_CLASS} justify-between`}>
                <span>{preset.label}</span>
                <span className="text-[13px] text-muted-foreground">{formatReminder(preset.date).split(", ")[1]}</span>
              </DropdownMenuItem>
            ))}
            <DropdownMenuItem onClick={openPicker} className={ITEM_CLASS}>
              <CalendarClock className="size-[18px]" aria-hidden="true" />
              Pick date &amp; time
            </DropdownMenuItem>
          </DropdownMenuGroup>
          {value && (
            <>
              <DropdownMenuSeparator className="bg-border" />
              <DropdownMenuItem variant="destructive" onClick={() => onChange(null)} className={ITEM_CLASS}>
                <X className="size-[18px]" aria-hidden="true" />
                Remove reminder
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="rounded-2xl p-6 sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-lg font-extrabold">Pick date &amp; time</DialogTitle>
          </DialogHeader>
          <input
            type="datetime-local"
            value={custom}
            min={openedAt ? toDateTimeLocal(new Date(openedAt)) : undefined}
            onChange={(event) => setCustom(event.target.value)}
            aria-label="Reminder date and time"
            className="h-[42px] w-full rounded-[10px] border border-border bg-card px-3 text-[15px] outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-focus"
          />
          {custom && !customValid && <p className="text-xs text-destructive">Choose a time in the future.</p>}
          <DialogFooter className="mx-0 mb-0 rounded-none border-0 bg-transparent p-0">
            <Button variant="outline" onClick={() => setPickerOpen(false)} className="h-10 rounded-[10px] px-4 text-[15px]">
              Cancel
            </Button>
            <Button
              disabled={!customValid}
              onClick={() => {
                choose(customDate);
                setPickerOpen(false);
              }}
              className="h-10 rounded-[10px] px-5 text-[15px] font-bold"
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
