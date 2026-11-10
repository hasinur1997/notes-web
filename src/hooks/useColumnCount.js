"use client";

import { useEffect, useState } from "react";

/**
 * Measures an element and returns how many columns of at least `minColumnWidth` fit,
 * so the masonry grid adapts to the available width (and to the sidebar opening/closing).
 *
 * @param {React.RefObject<HTMLElement>} ref - The grid container.
 * @param {number} minColumnWidth - Smallest allowed column width in px.
 * @param {number} gap - Gap between columns in px.
 * @param {number} [maxColumns=4] - Upper bound.
 * @returns {number} Column count (at least 1).
 */
export function useColumnCount(ref, minColumnWidth, gap, maxColumns = 4) {
  const [count, setCount] = useState(maxColumns);

  useEffect(() => {
    const element = ref.current;
    if (!element) return undefined;
    const observer = new ResizeObserver(([entry]) => {
      const fit = Math.floor((entry.contentRect.width + gap) / (minColumnWidth + gap));
      setCount(Math.min(maxColumns, Math.max(1, fit)));
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, minColumnWidth, gap, maxColumns]);

  return count;
}
