"use client";

import { useEffect, useRef, useState } from "react";
import { useColumnCount } from "@/hooks/useColumnCount";

const MIN_COLUMN_WIDTH = 240;
const GAP = 16;
/** Entry animation for a card the grid has not shown before. */
const ENTER_CLASS = "animate-in fade-in-0 slide-in-from-bottom-2 duration-300 ease-out fill-mode-both";
/** Delay between cards entering together, and the most cards that are staggered. */
const STAGGER_MS = 30;
const MAX_STAGGERED = 12;
/** Cards count as shown once their entry animation has had time to finish. */
const SETTLE_MS = 300 + MAX_STAGGERED * STAGGER_MS;
/**
 * Ids of notes any grid has already shown in this session. Shared across grids and pages, so going
 * back to a page does not replay the entry animation for cards the user has already seen.
 */
const shownIds = new Set();

/**
 * Splits items into columns left to right (item 1 → column 1, item 2 → column 2, …),
 * so reading order stays newest-first across each row.
 *
 * @template T
 * @param {T[]} items - Items in display order.
 * @param {number} columnCount - Number of columns.
 * @returns {T[][]} One array per column.
 */
export function distributeIntoColumns(items, columnCount) {
  const columns = Array.from({ length: columnCount }, () => []);
  items.forEach((item, index) => columns[index % columnCount].push(item));
  return columns;
}

/**
 * Masonry grid of notes: equal-width columns where each card keeps its natural height.
 * The column count follows the available width (up to 4). Cards fade in the first time they are
 * shown in this session (staggered when several arrive together), but not again when a resize or
 * a new note moves them to another column, or when the user comes back to the page.
 *
 * @param {object} props
 * @param {object[]} props.notes - Notes in display order.
 * @param {(note: object) => React.ReactNode} props.renderNote - Renders one note.
 * @returns {JSX.Element}
 */
export function NoteGrid({ notes, renderNote }) {
  const ref = useRef(null);
  const columnCount = useColumnCount(ref, MIN_COLUMN_WIDTH, GAP);
  // Ids are added to shownIds only after the entry animation, so a card that remounts in another
  // column meanwhile (e.g. the first width measurement) still animates instead of popping in.
  const newIds = notes.filter((note) => !shownIds.has(note._id)).map((note) => note._id);

  useEffect(() => {
    const timer = setTimeout(() => notes.forEach((note) => shownIds.add(note._id)), SETTLE_MS);
    return () => clearTimeout(timer);
  }, [notes]);

  return (
    <div ref={ref} className="flex items-start gap-4">
      {distributeIntoColumns(notes, columnCount).map((column, index) => (
        <div key={index} className="flex min-w-0 flex-1 flex-col gap-4">
          {column.map((note) => (
            <GridItem key={note._id} enterOrder={newIds.indexOf(note._id)}>
              {renderNote(note)}
            </GridItem>
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * One card slot. Whether it animates is decided once, when it mounts, so a re-render of the
 * grid (e.g. after data reloads) never cuts an entry animation short.
 *
 * @param {{ enterOrder: number, children: React.ReactNode }} props - `enterOrder` is the card's
 *   position among the newly shown cards, or -1 if the grid has shown it before.
 * @returns {JSX.Element}
 */
function GridItem({ enterOrder, children }) {
  const [order] = useState(enterOrder);
  if (order === -1) return <div>{children}</div>;
  return (
    <div className={ENTER_CLASS} style={{ animationDelay: `${Math.min(order, MAX_STAGGERED) * STAGGER_MS}ms` }}>
      {children}
    </div>
  );
}
