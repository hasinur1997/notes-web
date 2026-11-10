"use client";

import { useState } from "react";
import { Check, Tag, Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

/**
 * Dialog listing the user's labels; each can be renamed or deleted across all notes.
 *
 * @param {object} props
 * @param {boolean} props.open - Whether the dialog is shown.
 * @param {(open: boolean) => void} props.onOpenChange - Opens or closes it.
 * @param {{ name: string, count: number }[]} props.labels - Labels with note counts.
 * @param {(from: string, to: string) => Promise<void>} props.onRename - Renames a label; rejects on failure.
 * @param {(name: string) => Promise<void>} props.onDelete - Deletes a label.
 * @returns {JSX.Element}
 */
export function EditLabelsDialog({ open, onOpenChange, labels, onRename, onDelete }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-4 rounded-2xl p-6 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-extrabold">Edit labels</DialogTitle>
          <DialogDescription className="text-[15px]">
            Renaming or deleting a label changes it on every note. Notes are never deleted.
          </DialogDescription>
        </DialogHeader>
        <ul className="flex max-h-[60svh] flex-col gap-2 overflow-y-auto">
          {labels.map((label) => (
            <LabelRow key={label.name} label={label} onRename={onRename} onDelete={onDelete} />
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}

/**
 * One editable label: name field, save (when changed) and delete with confirmation.
 *
 * @param {object} props
 * @param {{ name: string, count: number }} props.label - The label.
 * @param {(from: string, to: string) => Promise<void>} props.onRename - Renames it.
 * @param {(name: string) => Promise<void>} props.onDelete - Deletes it.
 * @returns {JSX.Element}
 */
function LabelRow({ label, onRename, onDelete }) {
  const [name, setName] = useState(label.name);
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const trimmed = name.trim().replace(/\s+/g, " ");
  const changed = trimmed.length > 0 && trimmed !== label.name;

  /** Saves the new name. */
  async function handleSubmit(event) {
    event.preventDefault();
    if (!changed || saving) return;
    setSaving(true);
    try {
      await onRename(label.name, trimmed);
    } catch {
      setName(label.name);
    } finally {
      setSaving(false);
    }
  }

  return (
    <li>
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <Tag className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={30}
          aria-label={`Rename label ${label.name}`}
          className="h-10 min-w-0 flex-1 rounded-[10px] border border-border bg-card px-3 text-[15px] outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40"
        />
        <span className="w-8 shrink-0 text-center text-[13px] text-muted-foreground" title="Notes with this label">
          {label.count}
        </span>
        <button
          type="submit"
          disabled={!changed || saving}
          aria-label={`Save new name for ${label.name}`}
          className="flex size-9 shrink-0 items-center justify-center rounded-full text-brand-strong hover:bg-brand-soft disabled:opacity-30"
        >
          <Check className="size-[18px]" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          aria-label={`Delete label ${label.name}`}
          className="flex size-9 shrink-0 items-center justify-center rounded-full text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="size-[18px]" aria-hidden="true" />
        </button>
      </form>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`Delete label "${label.name}"?`}
        description={`It will be removed from ${label.count} ${label.count === 1 ? "note" : "notes"}. The notes themselves stay.`}
        onConfirm={() => onDelete(label.name)}
      />
    </li>
  );
}
