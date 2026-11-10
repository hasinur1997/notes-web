"use client";

import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";

const DEBOUNCE_MS = 300;

/**
 * Rounded search field in the header. Typing updates the search after a short pause
 * (debounced) so the API is not called on every keystroke. Escape or the clear button empties it.
 *
 * @param {object} props
 * @param {string} props.value - Current search term (from the URL).
 * @param {(term: string) => void} props.onSearch - Called with the trimmed term (empty string clears).
 * @returns {JSX.Element}
 */
export function SearchBox({ value, onSearch }) {
  const [text, setText] = useState(value);
  const [syncedValue, setSyncedValue] = useState(value);

  // When the term changes from outside (back button, clicking a label), show the new value.
  if (value !== syncedValue) {
    setSyncedValue(value);
    setText(value);
  }

  useEffect(() => {
    const term = text.trim();
    if (term === value) return undefined;
    const timer = setTimeout(() => onSearch(term), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [text, value, onSearch]);

  return (
    <form role="search" onSubmit={(event) => event.preventDefault()} className="relative w-full">
      <Search
        className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
      <input
        type="search"
        value={text}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={(event) => event.key === "Escape" && setText("")}
        placeholder="Search your notes"
        aria-label="Search your notes"
        maxLength={100}
        className="h-11 w-full rounded-full border border-border bg-card pr-11 pl-12 text-[15px] outline-none placeholder:text-placeholder focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40 [&::-webkit-search-cancel-button]:hidden"
      />
      {text && (
        <button
          type="button"
          onClick={() => setText("")}
          aria-label="Clear search"
          className="absolute top-1/2 right-2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      )}
    </form>
  );
}
