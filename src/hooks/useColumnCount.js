"use client";

import { useLayoutEffect, useState } from "react";

/**
 * Measures an element and returns how many columns of at least `minColumnWidth` fit,
 * so the masonry grid adapts to the available width (and to the sidebar opening/closing).
 * The first measurement happens before the browser paints, so the grid never visibly jumps
 * from the default column count to the real one.
 *
 * @param {React.RefObject<HTMLElement>} ref - The grid container.
 * @param {number} minColumnWidth - Smallest allowed column width in px.
 * @param {number} gap - Gap between columns in px.
 * @param {number} [maxColumns=4] - Upper bound.
 * @returns {number} Column count (at least 1).
 */
export function useColumnCount(ref, minColumnWidth, gap, maxColumns = 4) {
  const [count, setCount] = useState(maxColumns);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return undefined;
    const update = (width) => {
      const fit = Math.floor((width + gap) / (minColumnWidth + gap));
      setCount(Math.min(maxColumns, Math.max(1, fit)));
    };
    update(element.clientWidth);
    const observer = new ResizeObserver(([entry]) => update(entry.contentRect.width));
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, minColumnWidth, gap, maxColumns]);

  return count;
}
