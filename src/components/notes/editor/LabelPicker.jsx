"use client";

import { useState } from "react";
import { Check, Plus, Search } from "lucide-react";
import { Popover, PopoverContent } from "@/components/ui/popover";

/** Must match the API limits. */
export const MAX_LABELS = 10;
const MAX_LABEL_LENGTH = 30;

/** Trims and collapses spaces, the same way the API stores labels. */
function cleanLabel(text) {
  return text.trim().replace(/\s+/g, " ");
}

/**
 * "Label note" panel: search the user's labels, tick the ones on this note, or create a new
 * label from the search text. Opens next to the given anchor (the toolbar's More button).
 *
 * @param {object} props
 * @param {boolean} props.open - Whether the panel is shown.
 * @param {(open: boolean) => void} props.onOpenChange - Opens or closes it.
 * @param {React.RefObject<HTMLElement>} props.anchor - Element the panel is positioned against.
 * @param {string[]} props.allLabels - Every label the user has.
 * @param {string[]} props.value - Labels on this note.
 * @param {(labels: string[]) => void} props.onChange - Called with the note's new labels.
 * @returns {JSX.Element}
 */
export function LabelPicker({ open, onOpenChange, anchor, allLabels, value, onChange }) {
  const [query, setQuery] = useState("");
  const term = cleanLabel(query);
  const lower = term.toLowerCase();
  const atLimit = value.length >= MAX_LABELS;

  // The note's own labels are always listed, even if they are not in the user's list yet.
  const options = [...new Set([...allLabels, ...value])].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
  const filtered = lower ? options.filter((label) => label.toLowerCase().includes(lower)) : options;
  const exactMatch = options.find((label) => label.toLowerCase() === lower);
  const canCreate = Boolean(term) && !exactMatch && !atLimit;

  /** Adds or removes a label on the note. */
  function toggle(label) {
    if (value.includes(label)) onChange(value.filter((item) => item !== label));
    else if (!atLimit) onChange([...value, label]);
  }

  /** Adds the search text as a new label on the note. */
  function create() {
    if (!canCreate) return;
    onChange([...value, term]);
    setQuery("");
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) setQuery("");
      }}
    >
      <PopoverContent
        anchor={anchor}
        side="bottom"
        align="start"
        className="w-64 gap-0 rounded-2xl border border-border p-0 shadow-[0_8px_24px_-6px] shadow-foreground/20 ring-0"
      >
        <div className="px-4 pt-3.5 pb-1">
          <p className="text-[15px] font-bold">Label note</p>
          <div className="relative mt-1.5">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key !== "Enter") return;
                event.preventDefault();
                if (exactMatch) toggle(exactMatch);
                else create();
              }}
              placeholder="Enter label name"
              aria-label="Search or create a label"
              maxLength={MAX_LABEL_LENGTH}
              autoFocus
              className="h-9 w-full border-b border-border bg-transparent pr-7 text-[15px] outline-none placeholder:text-placeholder focus:border-brand-strong"
            />
            <Search className="pointer-events-none absolute top-1/2 right-0.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          </div>
        </div>

        <ul className="max-h-64 overflow-y-auto py-1.5" aria-label="Labels">
          {filtered.map((label) => {
            const checked = value.includes(label);
            const disabled = !checked && atLimit;
            return (
              <li key={label}>
                <label
                  className={`flex h-10 cursor-pointer items-center gap-3 px-4 text-[15px] hover:bg-brand-soft/60 ${
                    disabled ? "cursor-not-allowed opacity-50" : ""
                  }`}
                >
                  <input type="checkbox" checked={checked} disabled={disabled} onChange={() => toggle(label)} className="peer sr-only" />
                  <span
                    aria-hidden="true"
                    className={`flex size-[18px] shrink-0 items-center justify-center rounded-[4px] border-2 peer-focus-visible:ring-3 peer-focus-visible:ring-focus ${
                      checked ? "border-brand-strong bg-brand-strong text-white" : "border-muted-foreground"
                    }`}
                  >
                    {checked && <Check className="size-3.5" strokeWidth={3} />}
                  </span>
                  <span className="truncate">{label}</span>
                </label>
              </li>
            );
          })}
          {filtered.length === 0 && !canCreate && (
            <li className="px-4 py-2 text-[13px] text-muted-foreground">{atLimit ? `Up to ${MAX_LABELS} labels per note.` : "No labels yet."}</li>
          )}
        </ul>

        {canCreate && (
          <button
            type="button"
            onClick={create}
            className="flex h-11 w-full items-center gap-3 border-t border-border px-4 text-left text-[15px] hover:bg-brand-soft/60 focus-visible:bg-brand-soft/60 focus-visible:outline-none"
          >
            <Plus className="size-[18px] shrink-0 text-brand-strong" aria-hidden="true" />
            <span className="truncate">
              Create <span className="font-bold">&quot;{term}&quot;</span>
            </span>
          </button>
        )}
      </PopoverContent>
    </Popover>
  );
}
