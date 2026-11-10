"use client";

import { useEffect, useRef, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cropRect, initialView, MAX_ZOOM, panView, renderCrop, zoomView } from "@/lib/crop";

/** Side of the square crop area in px (fits a 390px-wide phone screen). */
const STAGE = 288;
const ZOOM_STEP = 0.1;
const KEY_MOVE = 10;

/**
 * Square photo cropper with a circular preview. Drag (mouse, touch or pen) to position, zoom with
 * the slider, the wheel or the − / + buttons; arrow keys move and + / − zoom when the photo is focused.
 * Apply produces a square JPEG (up to 512×512) of exactly what is inside the frame.
 *
 * @param {object} props
 * @param {File | null} props.file - Photo to crop (the dialog is open while this is set).
 * @param {() => void} props.onCancel - Closes without changes.
 * @param {(cropped: File) => void} props.onApply - Receives the cropped image.
 * @returns {JSX.Element}
 */
export function CropPhotoDialog({ file, onCancel, onApply }) {
  return (
    <Dialog open={Boolean(file)} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="gap-4 rounded-2xl p-6 sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-lg font-extrabold">Crop photo</DialogTitle>
          <DialogDescription className="text-[15px]">Drag to position and zoom to fit. The circle is your profile photo.</DialogDescription>
        </DialogHeader>
        {/* Remounted per file so each photo starts centred. */}
        {file && <Cropper key={`${file.name}-${file.lastModified}-${file.size}`} file={file} onCancel={onCancel} onApply={onApply} />}
      </DialogContent>
    </Dialog>
  );
}

/**
 * The interactive crop area and its controls for one file.
 *
 * @param {object} props
 * @param {File} props.file - Photo to crop.
 * @param {() => void} props.onCancel - Closes without changes.
 * @param {(cropped: File) => void} props.onApply - Receives the cropped image.
 * @returns {JSX.Element}
 */
function Cropper({ file, onCancel, onApply }) {
  const [src, setSrc] = useState(""); // data URL of the photo, once read
  const [image, setImage] = useState(null); // natural size once loaded
  const [view, setView] = useState({ zoom: 1, x: 0, y: 0 });
  const [error, setError] = useState("");
  const [applying, setApplying] = useState(false);
  const imgRef = useRef(null);
  const drag = useRef(null);

  // Read the file as a data URL. Each run reads independently and its cleanup only cancels that
  // read, so React Strict Mode's extra setup/cleanup pass in development cannot break the image
  // (an object URL created once and revoked in a cleanup was revoked before it could load).
  useEffect(() => {
    let cancelled = false;
    const reader = new FileReader();
    reader.onload = () => {
      if (!cancelled) setSrc(String(reader.result));
    };
    reader.onerror = () => {
      if (!cancelled) setError("This file couldn't be read. Try another photo.");
    };
    reader.readAsDataURL(file);
    return () => {
      cancelled = true;
      if (reader.readyState === FileReader.LOADING) reader.abort();
    };
  }, [file]);

  /** Reads the natural size and centres the photo. */
  function handleLoad(event) {
    const size = { width: event.currentTarget.naturalWidth, height: event.currentTarget.naturalHeight };
    setImage(size);
    setView(initialView(size, STAGE));
  }

  const scale = image ? Math.max(STAGE / image.width, STAGE / image.height) * view.zoom : 1;
  const setZoom = (zoom) => image && setView((current) => zoomView(current, zoom, image, STAGE));
  const move = (dx, dy) => image && setView((current) => panView(current, dx, dy, image, STAGE));

  /** Starts dragging and captures the pointer so the drag continues outside the stage. */
  function handlePointerDown(event) {
    if (!image) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { x: event.clientX, y: event.clientY };
  }

  /** Moves the photo by the pointer's movement since the last event. */
  function handlePointerMove(event) {
    if (!drag.current) return;
    move(event.clientX - drag.current.x, event.clientY - drag.current.y);
    drag.current = { x: event.clientX, y: event.clientY };
  }

  /** Arrow keys move; + / − zoom. */
  function handleKeyDown(event) {
    const moves = { ArrowLeft: [KEY_MOVE, 0], ArrowRight: [-KEY_MOVE, 0], ArrowUp: [0, KEY_MOVE], ArrowDown: [0, -KEY_MOVE] };
    if (moves[event.key]) {
      event.preventDefault();
      move(...moves[event.key]);
    } else if (event.key === "+" || event.key === "=") {
      event.preventDefault();
      setZoom(view.zoom + ZOOM_STEP);
    } else if (event.key === "-") {
      event.preventDefault();
      setZoom(view.zoom - ZOOM_STEP);
    }
  }

  /** Crops and hands the result to the parent. */
  async function apply() {
    if (!image || !imgRef.current) return;
    setApplying(true);
    try {
      onApply(await renderCrop(imgRef.current, cropRect(view, image, STAGE)));
    } catch {
      setError("This photo couldn't be cropped. Try another one.");
      setApplying(false);
    }
  }

  return (
    <>
      <div
        role="application"
        aria-label="Photo position. Drag or use the arrow keys to move, plus and minus to zoom."
        tabIndex={0}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={() => (drag.current = null)}
        onPointerCancel={() => (drag.current = null)}
        onWheel={(event) => setZoom(view.zoom - Math.sign(event.deltaY) * ZOOM_STEP)}
        onKeyDown={handleKeyDown}
        className="relative mx-auto cursor-grab touch-none overflow-hidden rounded-xl bg-foreground select-none focus-visible:ring-3 focus-visible:ring-ring/60 focus-visible:outline-none active:cursor-grabbing"
        style={{ width: STAGE, height: STAGE }}
      >
        {src && (
          // eslint-disable-next-line @next/next/no-img-element -- local file preview drawn to a canvas; next/image cannot be used
          <img
            ref={imgRef}
            src={src}
            alt="Photo being cropped"
            onLoad={handleLoad}
            onError={() => setError("This file couldn't be opened as an image.")}
            draggable={false}
            className="pointer-events-none absolute top-0 left-0 max-w-none origin-top-left"
            style={{
              transform: `translate(${view.x}px, ${view.y}px) scale(${scale})`,
              visibility: image ? "visible" : "hidden",
            }}
          />
        )}
        {!src && !error && (
          <span className="absolute inset-0 flex items-center justify-center text-sm text-white/80" role="status">
            Loading photo…
          </span>
        )}
        {/* Darken everything outside the circle and outline the circle. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-full border-2 border-white/90"
          style={{ boxShadow: "0 0 0 9999px rgba(43, 33, 26, 0.55)" }}
        />
      </div>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setZoom(view.zoom - ZOOM_STEP * 2)}
            aria-label="Zoom out"
            disabled={!image || view.zoom <= 1}
            className="flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-foreground/5 disabled:opacity-35"
          >
            <Minus className="size-4" aria-hidden="true" />
          </button>
          <input
            type="range"
            min={1}
            max={MAX_ZOOM}
            step={0.01}
            value={view.zoom}
            onChange={(event) => setZoom(Number(event.target.value))}
            disabled={!image}
            aria-label="Zoom"
            className="h-1.5 min-w-0 flex-1 cursor-pointer accent-[var(--primary)]"
          />
          <button
            type="button"
            onClick={() => setZoom(view.zoom + ZOOM_STEP * 2)}
            aria-label="Zoom in"
            disabled={!image || view.zoom >= MAX_ZOOM}
            className="flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-foreground/5 disabled:opacity-35"
          >
            <Plus className="size-4" aria-hidden="true" />
          </button>
        </div>
      )}

      <DialogFooter className="mx-0 mb-0 rounded-none border-0 bg-transparent p-0">
        <Button type="button" variant="outline" onClick={onCancel} className="h-10 rounded-[10px] px-4 text-[15px]">
          Cancel
        </Button>
        <Button type="button" onClick={apply} disabled={!image || applying || Boolean(error)} className="h-10 rounded-[10px] px-5 text-[15px] font-bold">
          {applying ? "Applying…" : "Apply"}
        </Button>
      </DialogFooter>
    </>
  );
}
