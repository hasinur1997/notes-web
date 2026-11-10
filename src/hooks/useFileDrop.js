"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Whether a drag event carries files (as opposed to text, links or elements).
 *
 * @param {DragEvent | React.DragEvent} event - Drag event.
 * @returns {boolean} True if files are being dragged.
 */
export function isFileDrag(event) {
  return Array.from(event.dataTransfer?.types ?? []).includes("Files");
}

/**
 * Makes an element a drop target for files. Only drags that carry files are handled, so text
 * and link drags keep their normal behaviour. A counter tracks enter/leave across child
 * elements, so the highlight does not flicker while moving over the content.
 *
 * @param {(files: File[]) => void} onFiles - Called with the dropped files.
 * @param {{ disabled?: boolean }} [options] - Set `disabled` to ignore drops.
 * @returns {{ isDragging: boolean, dropProps: object }} Highlight state and props to spread on the element.
 */
export function useFileDrop(onFiles, { disabled = false } = {}) {
  const [isDragging, setIsDragging] = useState(false);
  const depth = useRef(0);

  const dropProps = {
    onDragEnter(event) {
      if (disabled || !isFileDrag(event)) return;
      event.preventDefault();
      depth.current += 1;
      setIsDragging(true);
    },
    onDragOver(event) {
      if (disabled || !isFileDrag(event)) return;
      // Required for the drop event to fire; also shows the "copy" cursor.
      event.preventDefault();
      event.dataTransfer.dropEffect = "copy";
    },
    onDragLeave(event) {
      if (disabled || !isFileDrag(event)) return;
      depth.current = Math.max(0, depth.current - 1);
      if (depth.current === 0) setIsDragging(false);
    },
    onDrop(event) {
      if (disabled || !isFileDrag(event)) return;
      event.preventDefault();
      event.stopPropagation();
      depth.current = 0;
      setIsDragging(false);
      const files = Array.from(event.dataTransfer.files ?? []);
      if (files.length) onFiles(files);
    },
  };

  return { isDragging, dropProps };
}

/**
 * Stops the browser from navigating away to open a file that is dropped outside any drop
 * target (which would lose unsaved work). Mount once per page.
 *
 * @returns {void}
 */
export function usePreventFileDropNavigation() {
  useEffect(() => {
    const block = (event) => {
      if (isFileDrag(event)) event.preventDefault();
    };
    window.addEventListener("dragover", block);
    window.addEventListener("drop", block);
    return () => {
      window.removeEventListener("dragover", block);
      window.removeEventListener("drop", block);
    };
  }, []);
}

/**
 * Collects image files from a paste event (e.g. a screenshot copied to the clipboard).
 *
 * @param {ClipboardEvent | React.ClipboardEvent} event - Paste event.
 * @returns {File[]} Pasted image files (empty for text pastes).
 */
export function pastedImages(event) {
  return Array.from(event.clipboardData?.files ?? []).filter((file) => file.type.startsWith("image/"));
}
