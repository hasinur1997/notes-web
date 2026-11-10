"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { LabelChip } from "@/components/notes/LabelChip";

/** Must match the API limits. */
export const MAX_INTERESTS = 20;
const MAX_INTEREST_LENGTH = 50;

/**
 * Normalizes an interest the same way the API stores it (trimmed, single spaces, lowercase).
 *
 * @param {string} text - Typed text.
 * @returns {string} Normalized interest.
 */
export function normalizeInterest(text) {
  return text.trim().replace(/\s+/g, " ").toLowerCase();
}

/**
 * Edits a list of interests: chips with a remove button, plus a field that adds an interest on
 * Enter or comma (and when it loses focus). Backspace in an empty field removes the last one.
 *
 * @param {object} props
 * @param {string} props.id - Id of the text field (for the label).
 * @param {string[]} props.value - Current interests.
 * @param {(interests: string[]) => void} props.onChange - Called with the new list.
 * @returns {JSX.Element}
 */
export function InterestsInput({ id, value, onChange }) {
  const [draft, setDraft] = useState("");
  const atLimit = value.length >= MAX_INTERESTS;

  /** Adds the typed interest unless it is empty, a duplicate, or over the limit. */
  function commit() {
    const interest = normalizeInterest(draft);
    setDraft("");
    if (!interest || atLimit || value.includes(interest)) return;
    onChange([...value, interest]);
  }

  /** Enter or comma adds; Backspace on an empty field removes the last interest. */
  function handleKeyDown(event) {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      commit();
    } else if (event.key === "Backspace" && !draft && value.length) {
      onChange(value.slice(0, -1));
    }
  }

  return (
    <div className="flex min-h-[42px] flex-wrap items-center gap-1.5 rounded-[10px] border border-border bg-card px-3 py-2 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/40">
      {value.map((interest) => (
        <LabelChip key={interest}>
          {interest}
          <button
            type="button"
            onClick={() => onChange(value.filter((item) => item !== interest))}
            aria-label={`Remove interest ${interest}`}
            className="-mr-1 rounded-full p-0.5 hover:bg-primary/30"
          >
            <X className="size-3" aria-hidden="true" />
          </button>
        </LabelChip>
      ))}
      <input
        id={id}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={commit}
        disabled={atLimit}
        maxLength={MAX_INTEREST_LENGTH}
        placeholder={atLimit ? `Up to ${MAX_INTERESTS} interests` : value.length ? "Add another" : "e.g. hiking, books, coffee"}
        className="h-6 min-w-32 flex-1 bg-transparent text-[15px] outline-none placeholder:text-placeholder"
      />
    </div>
  );
}
