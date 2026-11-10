"use client";

import { useEffect, useRef, useState } from "react";
import { Baseline, EllipsisVertical, ImagePlus, Pin, Redo2, Undo2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { LabelInput } from "@/components/notes/LabelInput";
import { PeopleAvatars } from "@/components/notes/PeopleAvatars";
import { ReminderChip } from "@/components/notes/ReminderChip";
import { ColorMenu } from "@/components/notes/editor/ColorMenu";
import { FormatBar } from "@/components/notes/editor/FormatBar";
import { NoteImages } from "@/components/notes/editor/NoteImages";
import { ReminderMenu } from "@/components/notes/editor/ReminderMenu";
import { TOOLBAR_TRIGGER_CLASS, ToolbarButton } from "@/components/notes/editor/ToolbarButton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useUndoableState } from "@/hooks/useUndoableState";
import { applyFormat } from "@/lib/formatText";
import { noteColorClass } from "@/lib/noteColors";

/** Must match the API limits. */
const MAX_IMAGES = 5;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const SHORTCUT_FORMATS = { b: "bold", i: "italic", u: "underline" };

/**
 * Checks chosen files against the upload rules and reports the ones that are skipped.
 *
 * @param {File[]} files - Files from the picker.
 * @param {number} slotsLeft - How many more images the note can take.
 * @returns {File[]} Files that can be uploaded.
 */
function acceptImages(files, slotsLeft) {
  const valid = files.filter((file) => IMAGE_TYPES.includes(file.type) && file.size <= MAX_IMAGE_BYTES);
  if (valid.length < files.length) toast.error("Only JPEG, PNG, WebP or GIF images up to 5 MB can be added.");
  if (valid.length > slotsLeft) toast.error(`A note can have at most ${MAX_IMAGES} images.`);
  return valid.slice(0, Math.max(0, slotsLeft));
}

/**
 * The full note editor used by the inline composer and the edit dialog:
 * images, title, pin, Markdown text with a formatting bar, labels, reminder and collaborators,
 * and the toolbar (Formatting, Colour, Remind me, Collaborator, Add image, More, Undo, Redo, Close).
 * Text fields, labels, colour, pin and reminder are local state with undo/redo; images and
 * collaborators are handled by the parent (queued for new notes, saved at once for existing ones).
 *
 * @param {object} props
 * @param {{ title: string, content: string, labels: string[], pinned: boolean, color: string, reminderAt: string | null }} props.initialValues - Starting values.
 * @param {(values: object) => void} props.onChange - Called with the latest values after every change.
 * @param {() => void} props.onClose - Called by Close / Escape; the parent saves and closes.
 * @param {boolean} props.closing - Shows "Saving…" and disables Close.
 * @param {{ key: string, url: string, pending?: boolean }[]} props.images - Images to show.
 * @param {(files: File[]) => void} props.onAddImages - Adds validated image files.
 * @param {(key: string) => void} props.onRemoveImage - Removes an image.
 * @param {{ _id: string, name: string }[]} props.sharedWith - People shown as avatars.
 * @param {() => void} props.onOpenCollaborators - Opens the collaborators dialog.
 * @param {{ label: string, onSelect: () => void, destructive?: boolean }[]} props.moreActions - Items for the More menu.
 * @param {string[]} props.labelSuggestions - Labels the user already uses.
 * @param {boolean} [props.startWithLabels=false] - Opens with the label field visible.
 * @param {string} [props.footer] - Small text above the toolbar, e.g. "Edited 10 Nov 2026".
 * @returns {JSX.Element}
 */
export function NoteEditor({
  initialValues,
  onChange,
  onClose,
  closing,
  images,
  onAddImages,
  onRemoveImage,
  sharedWith,
  onOpenCollaborators,
  moreActions,
  labelSuggestions,
  startWithLabels = false,
  footer,
}) {
  const { value: values, set, undo, redo, canUndo, canRedo } = useUndoableState(initialValues);
  const [showFormat, setShowFormat] = useState(false);
  const [showLabels, setShowLabels] = useState(startWithLabels || initialValues.labels.length > 0);
  const contentRef = useRef(null);
  const fileRef = useRef(null);
  const pendingSelection = useRef(null);

  // Report every change to the parent, which saves on close.
  useEffect(() => {
    onChange(values);
  }, [values, onChange]);

  // Restore the selection after a formatting change re-renders the textarea.
  useEffect(() => {
    if (pendingSelection.current && contentRef.current) {
      const { start, end } = pendingSelection.current;
      contentRef.current.focus();
      contentRef.current.setSelectionRange(start, end);
      pendingSelection.current = null;
    }
  });

  /** Updates one field; `commit` makes it its own undo step. */
  function update(field, value, commit = false) {
    set((current) => ({ ...current, [field]: value }), { commit });
  }

  /** Applies a Markdown format at the current selection of the text area. */
  function format(kind) {
    const area = contentRef.current;
    const start = area?.selectionStart ?? values.content.length;
    const end = area?.selectionEnd ?? values.content.length;
    const result = applyFormat(values.content, start, end, kind);
    pendingSelection.current = { start: result.start, end: result.end };
    update("content", result.value, true);
  }

  /** Undo/redo and formatting shortcuts; Escape closes. Native textarea undo is replaced so both stay in sync. */
  function handleKeyDown(event) {
    // Menus and pickers render in portals; their keys (e.g. Escape to close a menu) must not reach the editor.
    if (!event.currentTarget.contains(event.target)) return;
    const mod = event.metaKey || event.ctrlKey;
    const key = event.key.toLowerCase();
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
    } else if (mod && key === "z") {
      event.preventDefault();
      if (event.shiftKey) redo();
      else undo();
    } else if (mod && key === "y") {
      event.preventDefault();
      redo();
    } else if (mod && SHORTCUT_FORMATS[key] && event.target === contentRef.current) {
      event.preventDefault();
      format(SHORTCUT_FORMATS[key]);
    }
  }

  /** Validates picked files and hands them to the parent. */
  function handleFiles(event) {
    const files = acceptImages([...(event.target.files ?? [])], MAX_IMAGES - images.length);
    event.target.value = "";
    if (files.length) onAddImages(files);
  }

  return (
    <div
      className={`rounded-2xl transition-colors ${noteColorClass(values.color)}`}
      onKeyDown={handleKeyDown}
    >
      <NoteImages images={images} onRemove={onRemoveImage} />

      <div className="flex items-start gap-2 pt-3 pr-3 pl-4.5">
        <input
          value={values.title}
          onChange={(event) => update("title", event.target.value)}
          placeholder="Title"
          aria-label="Title"
          maxLength={200}
          className="h-10 min-w-0 flex-1 bg-transparent text-[19px] font-bold outline-none placeholder:text-placeholder"
        />
        <ToolbarButton
          label={values.pinned ? "Unpin note" : "Pin note"}
          pressed={values.pinned}
          onClick={() => update("pinned", !values.pinned, true)}
        >
          <Pin className={`size-5 rotate-45 ${values.pinned ? "fill-primary text-brand-strong" : ""}`} aria-hidden="true" />
        </ToolbarButton>
      </div>

      <textarea
        ref={contentRef}
        value={values.content}
        onChange={(event) => update("content", event.target.value)}
        placeholder="Take a note…"
        aria-label="Note text"
        maxLength={20000}
        rows={1}
        className="field-sizing-content block max-h-[50svh] min-h-10 w-full resize-none bg-transparent px-4.5 py-1 text-[15px] leading-[22px] outline-none placeholder:text-placeholder"
      />

      {(showLabels || values.reminderAt || sharedWith.length > 0) && (
        <div className="flex flex-col gap-2 px-4 pt-2">
          {showLabels && (
            <LabelInput value={values.labels} onChange={(labels) => update("labels", labels, true)} suggestions={labelSuggestions} />
          )}
          {(values.reminderAt || sharedWith.length > 0) && (
            <div className="flex flex-wrap items-center gap-2">
              {values.reminderAt && <ReminderChip value={values.reminderAt} onRemove={() => update("reminderAt", null, true)} />}
              <PeopleAvatars people={sharedWith} onClick={onOpenCollaborators} />
            </div>
          )}
        </div>
      )}

      {footer && <p className="px-4.5 pt-2 text-right text-xs text-muted-foreground">{footer}</p>}

      {showFormat && <FormatBar onFormat={format} />}

      <div className="flex items-center gap-0.5 px-2.5 pt-1 pb-2" role="toolbar" aria-label="Note tools">
        <ToolbarButton label="Formatting options" pressed={showFormat} onClick={() => setShowFormat((open) => !open)}>
          <Baseline className="size-[18px]" aria-hidden="true" />
        </ToolbarButton>
        <ColorMenu value={values.color} onChange={(color) => update("color", color, true)} />
        <ReminderMenu value={values.reminderAt} onChange={(iso) => update("reminderAt", iso, true)} />
        <ToolbarButton label="Collaborator" onClick={onOpenCollaborators}>
          <UserPlus className="size-[18px]" aria-hidden="true" />
        </ToolbarButton>
        <ToolbarButton label="Add image" onClick={() => fileRef.current?.click()} disabled={images.length >= MAX_IMAGES}>
          <ImagePlus className="size-[18px]" aria-hidden="true" />
        </ToolbarButton>
        <input ref={fileRef} type="file" accept={IMAGE_TYPES.join(",")} multiple hidden onChange={handleFiles} />

        <DropdownMenu>
          <DropdownMenuTrigger aria-label="More" title="More" className={TOOLBAR_TRIGGER_CLASS}>
            <EllipsisVertical className="size-[18px]" aria-hidden="true" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48 rounded-2xl border border-border p-2 ring-0">
            <DropdownMenuItem onClick={() => setShowLabels(true)} className="h-10 rounded-lg px-2 text-[15px]">
              {showLabels ? "Change labels" : "Add label"}
            </DropdownMenuItem>
            {moreActions.map((action) => (
              <DropdownMenuItem
                key={action.label}
                onClick={action.onSelect}
                variant={action.destructive ? "destructive" : "default"}
                className="h-10 rounded-lg px-2 text-[15px]"
              >
                {action.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <ToolbarButton label="Undo (Ctrl+Z)" onClick={undo} disabled={!canUndo}>
          <Undo2 className="size-[18px]" aria-hidden="true" />
        </ToolbarButton>
        <ToolbarButton label="Redo (Ctrl+Shift+Z)" onClick={redo} disabled={!canRedo}>
          <Redo2 className="size-[18px]" aria-hidden="true" />
        </ToolbarButton>

        <button
          type="button"
          onClick={onClose}
          disabled={closing}
          className="ml-auto h-9 shrink-0 rounded-[10px] px-5 text-[15px] font-bold transition-colors hover:bg-foreground/5 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none disabled:opacity-60"
        >
          {closing ? "Saving…" : "Close"}
        </button>
      </div>
    </div>
  );
}
