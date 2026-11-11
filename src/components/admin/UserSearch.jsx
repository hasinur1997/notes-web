"use client";

import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";

const DEBOUNCE_MS = 300;

/**
 * Search field for people: filters by any part of a name or email as you type (debounced).
 *
 * @param {object} props
 * @param {string} props.value - Current search (from the URL).
 * @param {(term: string) => void} props.onSearch - Called with the trimmed text ("" clears).
 * @param {string} [props.className] - Extra classes for the wrapper.
 * @param {string} [props.placeholder] - Placeholder text.
 * @param {string} [props.label] - Accessible label for the field.
 * @returns {JSX.Element}
 */
export function UserSearch({
  value,
  onSearch,
  className = "",
  placeholder = "Search by name or email",
  label = "Search people by name or email",
}) {
  const [text, setText] = useState(value);
  const [synced, setSynced] = useState(value);

  // Follow outside changes (back button, "Clear").
  if (value !== synced) {
    setSynced(value);
    setText(value);
  }

  useEffect(() => {
    const term = text.trim();
    if (term === value) return undefined;
    const timer = setTimeout(() => onSearch(term), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [text, value, onSearch]);

  return (
    <div role="search" className={`relative ${className}`}>
      <Search className="pointer-events-none absolute top-1/2 left-3.5 size-[18px] -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
      <input
        type="search"
        value={text}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={(event) => event.key === "Escape" && setText("")}
        placeholder={placeholder}
        aria-label={label}
        maxLength={100}
        className="h-11 w-full rounded-xl border border-border bg-card pr-10 pl-10 text-[15px] outline-none placeholder:text-placeholder focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-focus [&::-webkit-search-cancel-button]:hidden"
      />
      {text && (
        <button
          type="button"
          onClick={() => setText("")}
          aria-label="Clear search"
          className="absolute top-1/2 right-1.5 flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
