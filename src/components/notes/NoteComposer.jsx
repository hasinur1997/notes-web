"use client";

import { useEffect, useRef, useState } from "react";
import { Pin, Tag } from "lucide-react";
import { LabelInput } from "@/components/notes/LabelInput";

const EMPTY = { title: "", content: "", labels: [], pinned: false };
const MAX_TITLE_LENGTH = 200;

/**
 * Builds the note to save. The API requires a title, so when only text was typed, its first
 * line becomes the title and the remaining lines stay as the text (nothing is shown twice).
 *
 * @param {{ title: string, content: string, labels: string[], pinned: boolean }} values - Composer values.
 * @returns {{ title: string, content: string, labels: string[], pinned: boolean } | null} The note, or null if empty.
 */
export function toNewNote({ title, content, labels, pinned }) {
  const cleanTitle = title.trim();
  const cleanContent = content.trim();
  if (!cleanTitle && !cleanContent) return null;
  if (cleanTitle) return { title: cleanTitle, content: cleanContent, labels, pinned };

  const [firstLine, ...rest] = cleanContent.split("\n");
  const derivedTitle = firstLine.trim().slice(0, MAX_TITLE_LENGTH);
  // A first line longer than the title limit keeps its overflow in the text.
  const overflow = firstLine.trim().slice(MAX_TITLE_LENGTH);
  const remaining = [overflow, ...rest].join("\n").trim();
  return { title: derivedTitle, content: remaining, labels, pinned };
}

/**
 * Small round icon button used in the composer.
 *
 * @param {object} props
 * @param {string} props.label - Accessible name and tooltip.
 * @param {boolean} [props.pressed] - Toggle state, if the button is a toggle.
 * @param {() => void} props.onClick - Click handler.
 * @param {React.ReactNode} props.children - The icon.
 * @returns {JSX.Element}
 */
function IconButton({ label, pressed, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={pressed}
      title={label}
      className="flex size-10 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-brand-soft hover:text-brand-strong focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none aria-pressed:text-brand-strong"
    >
      {children}
    </button>
  );
}

/**
 * Inline note composer. Collapsed, it is a "Take a note…" bar with shortcuts for a pinned
 * note or a labelled note. Expanded, it shows title, text, pin, labels and Close.
 * Closing (Close button, Escape, or clicking outside) saves the note if it has any text.
 *
 * @param {object} props
 * @param {(values: { title: string, content: string, labels: string[], pinned: boolean }) => Promise<void>} props.onCreate - Saves the note; rejects to keep the composer open.
 * @param {string[]} props.labelSuggestions - Labels the user already uses.
 * @returns {JSX.Element}
 */
export function NoteComposer({ onCreate, labelSuggestions }) {
  const [expanded, setExpanded] = useState(false);
  const [values, setValues] = useState(EMPTY);
  const [showLabels, setShowLabels] = useState(false);
  const [saving, setSaving] = useState(false);
  const rootRef = useRef(null);
  const contentRef = useRef(null);
  const closeRef = useRef(null);

  /** Updates one field. */
  function update(field, value) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  /** Opens the composer, optionally pinned or with the label field showing. */
  function expand({ pinned = false, labels = false } = {}) {
    setExpanded(true);
    if (pinned) update("pinned", true);
    if (labels) setShowLabels(true);
  }

  /** Saves the note (if it has text), then collapses and resets. Stays open if saving fails. */
  async function close() {
    if (saving) return;
    const note = toNewNote(values);
    if (note) {
      setSaving(true);
      try {
        await onCreate(note);
      } catch {
        setSaving(false);
        return;
      }
      setSaving(false);
    }
    setValues(EMPTY);
    setShowLabels(false);
    setExpanded(false);
  }

  // Keep the latest close() for the document listener without re-subscribing on every keystroke.
  useEffect(() => {
    closeRef.current = close;
  });

  // Clicking anywhere outside the expanded composer closes (and saves) it.
  useEffect(() => {
    if (!expanded) return undefined;
    function handlePointerDown(event) {
      if (rootRef.current && !rootRef.current.contains(event.target)) closeRef.current();
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [expanded]);

  // Move focus into the note text when the composer opens.
  useEffect(() => {
    if (expanded) contentRef.current?.focus();
  }, [expanded]);

  const cardClass =
    "mx-auto w-full max-w-[600px] rounded-2xl border border-border bg-card shadow-[0_8px_24px_-10px] shadow-foreground/15";

  if (!expanded) {
    return (
      <div className={`${cardClass} flex h-16 items-center gap-1 pr-3 pl-4.5`}>
        <button
          type="button"
          onClick={() => expand()}
          className="h-full min-w-0 flex-1 text-left text-base text-placeholder outline-none focus-visible:text-foreground"
        >
          Take a note…
        </button>
        <IconButton label="New pinned note" onClick={() => expand({ pinned: true })}>
          <Pin className="size-5 rotate-45" aria-hidden="true" />
        </IconButton>
        <IconButton label="New note with labels" onClick={() => expand({ labels: true })}>
          <Tag className="size-5" aria-hidden="true" />
        </IconButton>
      </div>
    );
  }

  return (
    <div
      ref={rootRef}
      className={cardClass}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          close();
        }
      }}
    >
      <div className="flex items-start gap-2 pt-3 pr-3 pl-4.5">
        <input
          value={values.title}
          onChange={(event) => update("title", event.target.value)}
          placeholder="Title"
          aria-label="Title"
          maxLength={MAX_TITLE_LENGTH}
          className="h-10 min-w-0 flex-1 bg-transparent text-[19px] font-bold outline-none placeholder:text-placeholder"
        />
        <IconButton
          label={values.pinned ? "Unpin note" : "Pin note"}
          pressed={values.pinned}
          onClick={() => update("pinned", !values.pinned)}
        >
          <Pin className={`size-5 rotate-45 ${values.pinned ? "fill-primary" : ""}`} aria-hidden="true" />
        </IconButton>
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

      {showLabels && (
        <div className="px-4 pt-2">
          <LabelInput value={values.labels} onChange={(labels) => update("labels", labels)} suggestions={labelSuggestions} />
        </div>
      )}

      <div className="flex items-center gap-1 px-2.5 pt-2 pb-2.5">
        <IconButton
          label={showLabels ? "Hide labels" : "Add labels"}
          pressed={showLabels}
          onClick={() => setShowLabels((open) => !open)}
        >
          <Tag className="size-5" aria-hidden="true" />
        </IconButton>
        <button
          type="button"
          onClick={close}
          disabled={saving}
          className="ml-auto h-9 rounded-[10px] px-5 text-[15px] font-bold transition-colors hover:bg-brand-soft focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none disabled:opacity-60"
        >
          {saving ? "Saving…" : "Close"}
        </button>
      </div>
    </div>
  );
}
