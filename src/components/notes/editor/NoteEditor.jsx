"use client";

import { useEffect, useRef, useState } from "react";
import { Baseline, EllipsisVertical, ImageDown, ImagePlus, Pin, Redo2, Undo2, UserPlus, X } from "lucide-react";
import { toast } from "sonner";
import { LabelChip } from "@/components/notes/LabelChip";
import { PeopleAvatars } from "@/components/notes/PeopleAvatars";
import { ReminderChip } from "@/components/notes/ReminderChip";
import { ImageCropDialog } from "@/components/crop/ImageCropDialog";
import { ColorMenu } from "@/components/notes/editor/ColorMenu";
import { FormatBar } from "@/components/notes/editor/FormatBar";
import { LabelPicker } from "@/components/notes/editor/LabelPicker";
import { NoteImages } from "@/components/notes/editor/NoteImages";
import { ReminderMenu } from "@/components/notes/editor/ReminderMenu";
import { TOOLBAR_TRIGGER_CLASS, ToolbarButton } from "@/components/notes/editor/ToolbarButton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { pastedImages, useFileDrop } from "@/hooks/useFileDrop";
import { useUndoableState } from "@/hooks/useUndoableState";
import { applyFormat } from "@/lib/formatText";
import { fetchImageFile } from "@/lib/imageUrl";
import { noteColorClass } from "@/lib/noteColors";

/** Must match the API limits. */
export const MAX_IMAGES = 5;
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
export function acceptImages(files, slotsLeft) {
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
 * Images can be added with the button, by dragging files onto the note, or by pasting them.
 *
 * @param {object} props
 * @param {{ title: string, content: string, labels: string[], pinned: boolean, color: string, reminderAt: string | null }} props.initialValues - Starting values.
 * @param {(values: object) => void} props.onChange - Called with the latest values after every change.
 * @param {() => void} props.onClose - Called by Close / Escape; the parent saves and closes.
 * @param {boolean} props.closing - Shows "Saving…" and disables Close.
 * @param {{ key: string, url: string, pending?: boolean }[]} props.images - Images to show.
 * @param {(files: File[]) => void} props.onAddImages - Adds validated image files.
 * @param {(key: string) => void} props.onRemoveImage - Removes an image.
 * @param {(key: string, file: File) => void} props.onReplaceImage - Replaces an image with its cropped version.
 * @param {{ _id: string, name: string }[]} props.sharedWith - People shown as avatars.
 * @param {() => void} props.onOpenCollaborators - Opens the collaborators dialog.
 * @param {{ label: string, onSelect: () => void, destructive?: boolean }[]} props.moreActions - Items for the More menu.
 * @param {string[]} props.labelSuggestions - All of the user's labels, offered in the "Label note" picker.
 * @param {boolean} [props.startWithLabels=false] - Opens the "Label note" picker right away.
 * @param {string} [props.footer] - Small text above the toolbar, e.g. "Edited 10 Nov 2026".
 * @param {"note" | "post"} [props.variant="note"] - "post" keeps the text, colour and image tools and hides
 *   pin, labels, reminder and collaborators (posts are public and have none of those).
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
  onReplaceImage,
  sharedWith,
  onOpenCollaborators,
  moreActions,
  labelSuggestions,
  startWithLabels = false,
  footer,
  variant = "note",
}) {
  const isPost = variant === "post";
  const noun = isPost ? "post" : "note";
  const { value: values, set, undo, redo, canUndo, canRedo } = useUndoableState(initialValues);
  const [showFormat, setShowFormat] = useState(false);
  // The labels shortcut opens the picker right away; its anchor ref is read after mount.
  const [pickerOpen, setPickerOpen] = useState(startWithLabels);
  // Image being cropped: its key and the file to crop.
  const [cropTarget, setCropTarget] = useState(null);
  const moreRef = useRef(null);
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

  const slotsLeft = MAX_IMAGES - images.length;

  /** Validates files (picked, dropped or pasted) and hands the accepted ones to the parent. */
  function addFiles(files) {
    const accepted = acceptImages(files, slotsLeft);
    if (accepted.length) onAddImages(accepted);
  }

  /** Files chosen with the "Add image" button. */
  function handleFiles(event) {
    addFiles([...(event.target.files ?? [])]);
    event.target.value = "";
  }

  /** A pasted screenshot or copied image is added like a dropped one; text pastes are untouched. */
  function handlePaste(event) {
    const files = pastedImages(event);
    if (!files.length) return;
    event.preventDefault();
    addFiles(files);
  }

  const { isDragging, dropProps } = useFileDrop(addFiles);

  /** Opens the cropper for an image: queued files directly, stored images after downloading them. */
  async function cropImage(key) {
    const image = images.find((item) => item.key === key);
    if (!image) return;
    try {
      setCropTarget({ key, file: image.file ?? (await fetchImageFile(image.url)) });
    } catch (err) {
      toast.error(err.message);
    }
  }

  return (
    <div
      className={`relative rounded-2xl transition-colors ${noteColorClass(values.color)}`}
      onKeyDown={handleKeyDown}
      onPaste={handlePaste}
      {...dropProps}
    >
      {isDragging && (
        <div
          className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-brand-strong bg-brand-soft/90 text-brand-strong"
          aria-hidden="true"
        >
          <ImageDown className="size-8" />
          <p className="text-[15px] font-bold">{slotsLeft > 0 ? "Drop images to add" : `This ${noun} already has ${MAX_IMAGES} images`}</p>
          {slotsLeft > 0 && <p className="text-xs">JPEG, PNG, WebP or GIF · up to {slotsLeft} more</p>}
        </div>
      )}
      <NoteImages images={images} onRemove={onRemoveImage} onCrop={cropImage} />
      <ImageCropDialog
        file={cropTarget?.file ?? null}
        title="Crop image"
        onCancel={() => setCropTarget(null)}
        onApply={(cropped) => {
          onReplaceImage(cropTarget.key, cropped);
          setCropTarget(null);
        }}
      />

      <div className="flex items-start gap-2 pt-3 pr-3 pl-4.5">
        <input
          value={values.title}
          onChange={(event) => update("title", event.target.value)}
          placeholder="Title"
          aria-label="Title"
          maxLength={200}
          className="h-10 min-w-0 flex-1 bg-transparent text-[19px] font-bold outline-none placeholder:text-placeholder"
        />
        {!isPost && (
          <ToolbarButton
            label={values.pinned ? "Unpin note" : "Pin note"}
            pressed={values.pinned}
            onClick={() => update("pinned", !values.pinned, true)}
          >
            <Pin className={`size-5 rotate-45 ${values.pinned ? "fill-primary text-brand-strong" : ""}`} aria-hidden="true" />
          </ToolbarButton>
        )}
      </div>

      <textarea
        ref={contentRef}
        value={values.content}
        onChange={(event) => update("content", event.target.value)}
        placeholder={isPost ? "Write your post…" : "Take a note…"}
        aria-label={isPost ? "Post text" : "Note text"}
        maxLength={20000}
        rows={1}
        className="field-sizing-content block max-h-[50svh] min-h-10 w-full resize-none bg-transparent px-4.5 py-1 text-[15px] leading-[22px] outline-none placeholder:text-placeholder"
      />

      {(values.labels.length > 0 || values.reminderAt || sharedWith.length > 0) && (
        <div className="flex flex-wrap items-center gap-1.5 px-4 pt-2">
          {values.labels.map((label) => (
            <LabelChip key={label}>
              <button type="button" onClick={() => setPickerOpen(true)} className="truncate" title="Change labels">
                {label}
              </button>
              <button
                type="button"
                onClick={() => update("labels", values.labels.filter((item) => item !== label), true)}
                aria-label={`Remove label ${label}`}
                className="-mr-1 rounded-full p-0.5 hover:bg-primary/30"
              >
                <X className="size-3" aria-hidden="true" />
              </button>
            </LabelChip>
          ))}
          {values.reminderAt && <ReminderChip value={values.reminderAt} onRemove={() => update("reminderAt", null, true)} />}
          <PeopleAvatars people={sharedWith} onClick={onOpenCollaborators} />
        </div>
      )}

      {footer && <p className="px-4.5 pt-2 text-right text-xs text-muted-foreground">{footer}</p>}

      {showFormat && <FormatBar onFormat={format} />}

      <div className="flex items-center gap-0.5 px-2.5 pt-1 pb-2" role="toolbar" aria-label={isPost ? "Post tools" : "Note tools"}>
        <ToolbarButton label="Formatting options" pressed={showFormat} onClick={() => setShowFormat((open) => !open)}>
          <Baseline className="size-[18px]" aria-hidden="true" />
        </ToolbarButton>
        <ColorMenu value={values.color} onChange={(color) => update("color", color, true)} />
        {!isPost && (
          <>
            <ReminderMenu value={values.reminderAt} onChange={(iso) => update("reminderAt", iso, true)} />
            <ToolbarButton label="Collaborator" onClick={onOpenCollaborators}>
              <UserPlus className="size-[18px]" aria-hidden="true" />
            </ToolbarButton>
          </>
        )}
        <ToolbarButton label="Add image" onClick={() => fileRef.current?.click()} disabled={images.length >= MAX_IMAGES}>
          <ImagePlus className="size-[18px]" aria-hidden="true" />
        </ToolbarButton>
        <input ref={fileRef} type="file" accept={IMAGE_TYPES.join(",")} multiple hidden onChange={handleFiles} />

        <DropdownMenu>
          <span ref={moreRef} className="flex">
            <DropdownMenuTrigger aria-label="More" title="More" className={TOOLBAR_TRIGGER_CLASS}>
              <EllipsisVertical className="size-[18px]" aria-hidden="true" />
            </DropdownMenuTrigger>
          </span>
          <DropdownMenuContent align="start" className="w-48 rounded-2xl border border-border p-2 ring-0">
            {!isPost && (
              <DropdownMenuItem onClick={() => setPickerOpen(true)} className="h-10 rounded-lg px-2 text-[15px]">
                {values.labels.length ? "Change labels" : "Add label"}
              </DropdownMenuItem>
            )}
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
          className="ml-auto h-9 shrink-0 rounded-[10px] px-5 text-[15px] font-bold transition-colors hover:bg-foreground/5 focus-visible:ring-3 focus-visible:ring-focus focus-visible:outline-none disabled:opacity-60"
        >
          {closing ? "Saving…" : "Close"}
        </button>
      </div>
      {!isPost && (
        <LabelPicker
          open={pickerOpen}
          onOpenChange={setPickerOpen}
          anchor={moreRef}
          allLabels={labelSuggestions}
          value={values.labels}
          onChange={(labels) => update("labels", labels, true)}
        />
      )}
    </div>
  );
}
