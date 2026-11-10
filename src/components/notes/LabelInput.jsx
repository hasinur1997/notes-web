"use client";

import { useId, useState } from "react";
import { X } from "lucide-react";
import { LabelChip } from "@/components/notes/LabelChip";

/** Must match the API limits for labels. */
export const MAX_LABELS = 10;
const MAX_LABEL_LENGTH = 30;

/**
 * Edits a note's labels: chips with a remove button, plus a text field that adds a label
 * on Enter or comma. Existing labels are offered as suggestions.
 *
 * @param {object} props
 * @param {string[]} props.value - Current labels.
 * @param {(labels: string[]) => void} props.onChange - Called with the new list.
 * @param {string[]} props.suggestions - Labels the user already uses.
 * @returns {JSX.Element}
 */
export function LabelInput({ value, onChange, suggestions }) {
  const [draft, setDraft] = useState("");
  const listId = useId();
  const atLimit = value.length >= MAX_LABELS;

  /** Adds the typed label unless it is empty or already present (case-insensitive). */
  function addDraft() {
    const label = draft.trim().replace(/\s+/g, " ");
    setDraft("");
    if (!label || atLimit) return;
    if (value.some((existing) => existing.toLowerCase() === label.toLowerCase())) return;
    onChange([...value, label]);
  }

  /** Enter or comma adds; Backspace on an empty field removes the last label. */
  function handleKeyDown(event) {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addDraft();
    } else if (event.key === "Backspace" && !draft && value.length) {
      onChange(value.slice(0, -1));
    }
  }

  return (
    <div className="flex min-h-[42px] flex-wrap items-center gap-1.5 rounded-[10px] border border-border bg-card px-3 py-2 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/40">
      {value.map((label) => (
        <LabelChip key={label}>
          {label}
          <button
            type="button"
            onClick={() => onChange(value.filter((item) => item !== label))}
            aria-label={`Remove label ${label}`}
            className="-mr-1 rounded-full p-0.5 hover:bg-primary/30"
          >
            <X className="size-3" aria-hidden="true" />
          </button>
        </LabelChip>
      ))}
      <input
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={addDraft}
        list={listId}
        disabled={atLimit}
        maxLength={MAX_LABEL_LENGTH}
        placeholder={atLimit ? `Up to ${MAX_LABELS} labels` : "Add a label"}
        aria-label="Add a label"
        className="h-6 min-w-24 flex-1 bg-transparent text-sm outline-none placeholder:text-placeholder"
      />
      <datalist id={listId}>
        {suggestions
          .filter((label) => !value.includes(label))
          .map((label) => (
            <option key={label} value={label} />
          ))}
      </datalist>
    </div>
  );
}
