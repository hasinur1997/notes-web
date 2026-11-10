"use client";

import { useCallback, useRef, useState } from "react";

/** Typing within this window counts as one undo step. */
const GROUP_MS = 600;
/** History entries kept per note. */
const MAX_HISTORY = 100;

/**
 * State with undo/redo. Rapid changes (typing) are grouped into one step; changes made with
 * `{ commit: true }` (formatting, colour, pin, labels) are always their own step.
 *
 * @template T
 * @param {T} initial - Starting value.
 * @returns {{
 *   value: T,
 *   set: (next: T | ((current: T) => T), options?: { commit?: boolean }) => void,
 *   undo: () => void, redo: () => void, canUndo: boolean, canRedo: boolean,
 * }}
 */
export function useUndoableState(initial) {
  const [history, setHistory] = useState({ past: [], present: initial, future: [] });
  const lastChange = useRef(0);

  const set = useCallback((next, { commit = false } = {}) => {
    const now = Date.now();
    const grouped = !commit && now - lastChange.current < GROUP_MS;
    lastChange.current = commit ? 0 : now;
    setHistory(({ past, present }) => {
      const value = typeof next === "function" ? next(present) : next;
      if (Object.is(value, present)) return { past, present, future: [] };
      const nextPast = grouped && past.length ? past : [...past, present].slice(-MAX_HISTORY);
      return { past: nextPast, present: value, future: [] };
    });
  }, []);

  const undo = useCallback(() => {
    lastChange.current = 0;
    setHistory(({ past, present, future }) =>
      past.length ? { past: past.slice(0, -1), present: past[past.length - 1], future: [present, ...future] } : { past, present, future },
    );
  }, []);

  const redo = useCallback(() => {
    lastChange.current = 0;
    setHistory(({ past, present, future }) =>
      future.length ? { past: [...past, present], present: future[0], future: future.slice(1) } : { past, present, future },
    );
  }, []);

  return {
    value: history.present,
    set,
    undo,
    redo,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
  };
}
