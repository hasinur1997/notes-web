"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

/**
 * "Take a note…" bar above the notes. Submitting opens the full note editor
 * with the typed text as the title.
 *
 * @param {object} props
 * @param {(title: string) => void} props.onCompose - Called with the trimmed text (may be empty).
 * @returns {JSX.Element}
 */
export function NoteComposer({ onCompose }) {
  const [text, setText] = useState("");

  /** Opens the editor and clears the bar. */
  function handleSubmit(event) {
    event.preventDefault();
    onCompose(text.trim());
    setText("");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto flex h-16 w-full max-w-[600px] items-center gap-2 rounded-2xl border border-border bg-card pr-2 pl-4.5 shadow-[0_8px_24px_-10px] shadow-foreground/10"
    >
      <input
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="Take a note…"
        aria-label="Take a note"
        maxLength={200}
        className="h-full min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-placeholder"
      />
      <button
        type="submit"
        className="inline-flex h-11 shrink-0 items-center gap-2 rounded-xl bg-primary px-[13px] text-sm font-bold hover:bg-primary/90 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
      >
        <Plus className="size-4" strokeWidth={2.5} aria-hidden="true" />
        Add note
      </button>
    </form>
  );
}
