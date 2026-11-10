"use client";

import { useRef, useState } from "react";
import { Check, Pencil, Plus, Tag, Trash2, X } from "lucide-react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

const MAX_LABEL_LENGTH = 30;
const ICON_BUTTON =
  "flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-35";
const UNDERLINE_INPUT =
  "h-9 min-w-0 flex-1 border-b bg-transparent text-[15px] outline-none placeholder:text-placeholder";

/** Trims and collapses spaces, the same way the API stores labels. */
function cleanLabel(text) {
  return text.trim().replace(/\s+/g, " ");
}

/**
 * "Edit labels" dialog: create a label, and rename or delete existing ones (changes apply to
 * every note). Deleting asks for confirmation; notes themselves are never deleted.
 *
 * @param {object} props
 * @param {boolean} props.open - Whether the dialog is shown.
 * @param {(open: boolean) => void} props.onOpenChange - Opens or closes it.
 * @param {{ name: string, count: number }[]} props.labels - Labels with note counts.
 * @param {(name: string) => Promise<void>} props.onCreate - Creates a label; rejects on failure.
 * @param {(from: string, to: string) => Promise<void>} props.onRename - Renames a label; rejects on failure.
 * @param {(name: string) => Promise<void>} props.onDelete - Deletes a label.
 * @returns {JSX.Element}
 */
export function EditLabelsDialog({ open, onOpenChange, labels, onCreate, onRename, onDelete }) {
  const names = labels.map((label) => label.name);
  /** Finds another label with the same name ignoring case. */
  const duplicateOf = (name, except) =>
    names.find((existing) => existing !== except && existing.toLowerCase() === name.toLowerCase());

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 rounded-2xl p-0 sm:max-w-sm" showCloseButton={false}>
        <div className="px-6 pt-6">
          <DialogTitle className="text-lg font-extrabold">Edit labels</DialogTitle>
          <DialogDescription className="sr-only">
            Create, rename or delete labels. Changes apply to every note; notes are never deleted.
          </DialogDescription>
        </div>

        <div className="max-h-[60svh] overflow-y-auto px-4 pt-3 pb-4">
          <CreateLabelRow onCreate={onCreate} isDuplicate={(name) => Boolean(duplicateOf(name))} />
          <ul className="mt-1 flex flex-col">
            {labels.map((label) => (
              <LabelRow
                key={label.name}
                label={label}
                onRename={onRename}
                onDelete={onDelete}
                isDuplicate={(name) => Boolean(duplicateOf(name, label.name))}
              />
            ))}
          </ul>
        </div>

        <div className="flex justify-end border-t border-border px-4 py-3">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="h-9 rounded-[10px] px-5 text-[15px] font-bold transition-colors hover:bg-foreground/5 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            Done
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * "Create new label" row: X clears (or + focuses when empty), ✓ creates.
 *
 * @param {object} props
 * @param {(name: string) => Promise<void>} props.onCreate - Creates the label.
 * @param {(name: string) => boolean} props.isDuplicate - Whether the name is already used.
 * @returns {JSX.Element}
 */
function CreateLabelRow({ onCreate, isDuplicate }) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const inputRef = useRef(null);
  const clean = cleanLabel(name);
  const duplicate = clean && isDuplicate(clean);
  const canCreate = Boolean(clean) && !duplicate && !busy;

  /** Creates the label and clears the field. */
  async function handleSubmit(event) {
    event.preventDefault();
    if (!canCreate) return;
    setBusy(true);
    try {
      await onCreate(clean);
      setName("");
    } catch {
      // The caller showed the error; keep the text so it can be corrected.
    } finally {
      setBusy(false);
      inputRef.current?.focus();
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex items-center gap-3">
        {name ? (
          <button type="button" onClick={() => setName("")} aria-label="Clear" title="Cancel" className={ICON_BUTTON}>
            <X className="size-5" aria-hidden="true" />
          </button>
        ) : (
          <button type="button" onClick={() => inputRef.current?.focus()} aria-label="Create new label" className={ICON_BUTTON}>
            <Plus className="size-5" aria-hidden="true" />
          </button>
        )}
        <input
          ref={inputRef}
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Create new label"
          aria-label="New label name"
          aria-invalid={duplicate || undefined}
          maxLength={MAX_LABEL_LENGTH}
          className={`${UNDERLINE_INPUT} ${duplicate ? "border-destructive" : "border-border focus:border-brand-strong"}`}
        />
        <button type="submit" disabled={!canCreate} aria-label="Create label" title="Create label" className={ICON_BUTTON}>
          <Check className="size-5" aria-hidden="true" />
        </button>
      </div>
      {duplicate && <p className="mt-1 pl-12 text-xs text-destructive">Label already exists</p>}
    </form>
  );
}

/**
 * One label: tag icon (a delete button on hover or focus), name, and a pencil to rename in place.
 *
 * @param {object} props
 * @param {{ name: string, count: number }} props.label - The label.
 * @param {(from: string, to: string) => Promise<void>} props.onRename - Renames it.
 * @param {(name: string) => Promise<void>} props.onDelete - Deletes it.
 * @param {(name: string) => boolean} props.isDuplicate - Whether a new name clashes with another label.
 * @returns {JSX.Element}
 */
function LabelRow({ label, onRename, onDelete, isDuplicate }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(label.name);
  const [busy, setBusy] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const clean = cleanLabel(name);
  const duplicate = clean && clean !== label.name && isDuplicate(clean);
  const canSave = Boolean(clean) && !duplicate && !busy;

  /** Leaves edit mode without saving. */
  function cancel() {
    setName(label.name);
    setEditing(false);
  }

  /** Saves the new name (or just closes if unchanged). */
  async function handleSubmit(event) {
    event.preventDefault();
    if (!canSave) return;
    if (clean === label.name) return cancel();
    setBusy(true);
    try {
      await onRename(label.name, clean);
      setEditing(false);
    } catch {
      setName(label.name);
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className="group/label">
      <form onSubmit={handleSubmit} className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          aria-label={`Delete label ${label.name}`}
          title="Delete label"
          className={`${ICON_BUTTON} hover:text-destructive`}
        >
          <Tag className="size-5 fill-current group-focus-within/label:hidden group-hover/label:hidden" aria-hidden="true" />
          <Trash2 className="hidden size-5 group-focus-within/label:block group-hover/label:block" aria-hidden="true" />
        </button>

        {editing ? (
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => event.key === "Escape" && (event.preventDefault(), event.stopPropagation(), cancel())}
            aria-label={`Rename label ${label.name}`}
            aria-invalid={duplicate || undefined}
            maxLength={MAX_LABEL_LENGTH}
            autoFocus
            className={`${UNDERLINE_INPUT} ${duplicate ? "border-destructive" : "border-border focus:border-brand-strong"}`}
          />
        ) : (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="h-9 min-w-0 flex-1 truncate text-left text-[15px] font-bold"
            title={`${label.count} ${label.count === 1 ? "note" : "notes"}`}
          >
            {label.name}
          </button>
        )}

        {/* Distinct keys: React must not reuse the pencil's DOM node as the submit button, or the
            click that starts editing would also submit the form and end editing immediately. */}
        {editing ? (
          <button key="save" type="submit" disabled={!canSave} aria-label={`Save new name for ${label.name}`} title="Rename" className={ICON_BUTTON}>
            <Check className="size-5" aria-hidden="true" />
          </button>
        ) : (
          <button key="edit" type="button" onClick={() => setEditing(true)} aria-label={`Rename label ${label.name}`} title="Rename" className={ICON_BUTTON}>
            <Pencil className="size-[18px]" aria-hidden="true" />
          </button>
        )}
      </form>
      {duplicate && <p className="mt-0.5 pl-12 text-xs text-destructive">Label already exists</p>}

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`Delete label "${label.name}"?`}
        description={
          label.count
            ? `It will be removed from ${label.count} ${label.count === 1 ? "note" : "notes"}. The notes themselves stay.`
            : "This label isn't used on any note."
        }
        onConfirm={() => onDelete(label.name)}
      />
    </li>
  );
}
