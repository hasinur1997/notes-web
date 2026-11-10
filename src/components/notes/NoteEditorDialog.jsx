"use client";

import { useState } from "react";
import { Pin, Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { LabelInput } from "@/components/notes/LabelInput";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

/**
 * Builds the editor's starting values from the note.
 *
 * @param {{ title: string, content: string, labels: string[], pinned: boolean } | null} note - Note being edited.
 * @returns {{ title: string, content: string, labels: string[], pinned: boolean }}
 */
function initialValues(note) {
  return {
    title: note?.title ?? "",
    content: note?.content ?? "",
    labels: note?.labels ?? [],
    pinned: note?.pinned ?? false,
  };
}

/**
 * Dialog for editing an existing note: title, content, labels and pin, plus delete.
 * New notes are written in the inline composer instead. Remount it (change its `key`) to start from fresh values.
 *
 * @param {object} props
 * @param {boolean} props.open - Whether the dialog is shown.
 * @param {(open: boolean) => void} props.onOpenChange - Opens or closes it.
 * @param {object | null} props.note - Note to edit (null only while the dialog is closed).
 * @param {string[]} props.labelSuggestions - Labels the user already uses.
 * @param {(values: { title: string, content: string, labels: string[], pinned: boolean }) => Promise<void>} props.onSave - Saves; rejects to keep the dialog open.
 * @param {(note: object) => Promise<void>} props.onDelete - Deletes the note.
 * @returns {JSX.Element}
 */
export function NoteEditorDialog({ open, onOpenChange, note, labelSuggestions, onSave, onDelete }) {
  const [values, setValues] = useState(() => initialValues(note));
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const canSave = values.title.trim().length > 0 && !saving;

  /** Updates one field. */
  function update(field, value) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  /** Saves and closes; stays open (with the toast from the caller) if saving fails. */
  async function handleSubmit(event) {
    event.preventDefault();
    if (!canSave) return;
    setSaving(true);
    try {
      await onSave({ ...values, title: values.title.trim() });
      onOpenChange(false);
    } catch {
      // The caller already showed the error; keep the user's input.
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 rounded-2xl p-0 sm:max-w-lg" showCloseButton={false}>
        <form onSubmit={handleSubmit}>
          <div className="flex items-center justify-between gap-3 px-6 pt-5">
            <DialogTitle className="text-[13px] font-semibold text-muted-foreground">
              Edit note
            </DialogTitle>
            <button
              type="button"
              onClick={() => update("pinned", !values.pinned)}
              aria-pressed={values.pinned}
              aria-label={values.pinned ? "Unpin note" : "Pin note"}
              className="flex size-8 items-center justify-center rounded-full hover:bg-brand-soft"
            >
              <Pin
                className={`size-[18px] rotate-45 text-brand-strong ${values.pinned ? "fill-primary" : ""}`}
                aria-hidden="true"
              />
            </button>
          </div>

          <div className="flex flex-col gap-3 px-6 pt-2 pb-6">
            <input
              value={values.title}
              onChange={(event) => update("title", event.target.value)}
              placeholder="Title"
              aria-label="Title"
              required
              maxLength={200}
              autoFocus
              className="w-full bg-transparent text-[19px] leading-7 font-bold outline-none placeholder:text-placeholder"
            />
            <Textarea
              value={values.content}
              onChange={(event) => update("content", event.target.value)}
              placeholder="Write your note…"
              aria-label="Note content"
              maxLength={20000}
              className="max-h-[50svh] min-h-32 rounded-[10px] border-border bg-card px-3 py-2.5 text-[15px] leading-[22px] md:text-[15px]"
            />
            <LabelInput
              value={values.labels}
              onChange={(labels) => update("labels", labels)}
              suggestions={labelSuggestions}
            />
          </div>

          <DialogFooter className="mx-0 mb-0 items-center rounded-b-2xl bg-background px-6 py-4 sm:justify-between">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setConfirmOpen(true)}
              className="h-10 gap-1.5 rounded-[10px] px-3 text-[15px] text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="size-4" aria-hidden="true" />
              Delete
            </Button>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="h-10 rounded-[10px] px-4 text-[15px]"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={!canSave} className="h-10 rounded-[10px] px-5 text-[15px] font-bold">
                {saving ? "Saving…" : "Save"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>

      {note && (
        <ConfirmDialog
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          title="Delete this note?"
          description={`"${note.title}" will be deleted permanently. This can't be undone.`}
          onConfirm={async () => {
            await onDelete(note);
            onOpenChange(false);
          }}
        />
      )}
    </Dialog>
  );
}
