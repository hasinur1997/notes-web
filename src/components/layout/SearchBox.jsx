"use client";

import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";

const DEBOUNCE_MS = 300;

/**
 * Rounded search field in the header. Typing updates the search after a short pause
 * (debounced) so the API is not called on every keystroke. Escape or the clear button empties it.
 * Pressing "/" anywhere outside a text field jumps to the search (a common app shortcut).
 *
 * @param {object} props
 * @param {string} props.value - Current search term (from the URL).
 * @param {(term: string) => void} props.onSearch - Called with the trimmed term (empty string clears).
 * @param {string} [props.placeholder="Search your notes"] - Placeholder and accessible name.
 * @returns {JSX.Element}
 */
export function SearchBox({ value, onSearch, placeholder = "Search your notes" }) {
  const [text, setText] = useState(value);
  const [syncedValue, setSyncedValue] = useState(value);
  const inputRef = useRef(null);

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

  // "/" focuses the search, unless the user is typing somewhere else.
  useEffect(() => {
    function handleKey(event) {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target;
      if (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;
      event.preventDefault();
      inputRef.current?.focus();
      inputRef.current?.select();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  return (
    <form role="search" onSubmit={(event) => event.preventDefault()} className="relative w-full">
      <Search
        className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
      <input
        ref={inputRef}
        type="search"
        value={text}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={(event) => event.key === "Escape" && setText("")}
        placeholder={placeholder}
        aria-keyshortcuts="/"
        aria-label={placeholder}
        maxLength={100}
        className="h-11 w-full rounded-full border border-border bg-card pr-11 pl-12 text-[15px] outline-none placeholder:text-placeholder focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-focus [&::-webkit-search-cancel-button]:hidden"
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
