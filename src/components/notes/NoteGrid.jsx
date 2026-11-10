"use client";

import { useRef } from "react";
import { useColumnCount } from "@/hooks/useColumnCount";

const MIN_COLUMN_WIDTH = 240;
const GAP = 16;

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
 * The column count follows the available width (up to 4).
 *
 * @param {object} props
 * @param {object[]} props.notes - Notes in display order.
 * @param {(note: object) => React.ReactNode} props.renderNote - Renders one note.
 * @returns {JSX.Element}
 */
export function NoteGrid({ notes, renderNote }) {
  const ref = useRef(null);
  const columnCount = useColumnCount(ref, MIN_COLUMN_WIDTH, GAP);

  return (
    <div ref={ref} className="flex items-start gap-4">
      {distributeIntoColumns(notes, columnCount).map((column, index) => (
        <div key={index} className="flex min-w-0 flex-1 flex-col gap-4">
          {column.map((note) => (
            <div key={note._id}>{renderNote(note)}</div>
          ))}
        </div>
      ))}
    </div>
  );
}
