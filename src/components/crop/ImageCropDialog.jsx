"use client";

import { useEffect, useRef, useState } from "react";
import { Maximize, RotateCcw, RotateCw, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  ASPECT_PRESETS,
  centeredRect,
  fitScale,
  fullRect,
  HANDLES,
  moveRect,
  renderCrop,
  resizeRect,
  resolveAspect,
  rotateImage,
  roundRect,
} from "@/lib/crop";

/** Largest height of the crop area, in px. */
const MAX_STAGE_HEIGHT = 420;
/** Smallest crop side, in display px (converted to image px at the current scale). */
const MIN_CROP_DISPLAY = 24;
/** Arrow key step as a fraction of the image's shorter side. */
const KEY_STEP = 0.01;
/** Length of the rotate animation, in ms. */
const ROTATE_MS = 280;
/** Easing of the rotate animation (fast start, gentle stop). */
const ROTATE_EASING = "cubic-bezier(0.2, 0, 0, 1)";

/** Resolves after `ms` milliseconds. */
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
/** Resolves on the next frame that has been painted (so a CSS transition has a start state). */
const nextPaint = () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

/**
 * Free-form image cropper in a dialog. The whole image is shown; the crop can be moved, resized
 * from 8 handles to any size, locked to an aspect preset, reset to the full image, and the image
 * rotated in 90° steps. Arrow keys move the crop; Shift+arrows resize it.
 *
 * @param {object} props
 * @param {File | null} props.file - Image to crop (the dialog is open while this is set).
 * @param {() => void} props.onCancel - Closes without changes.
 * @param {(cropped: File) => void} props.onApply - Receives the cropped image.
 * @param {string} [props.title="Crop image"] - Dialog title.
 * @param {string} [props.defaultAspect="free"] - Key of the preset selected at start (see ASPECT_PRESETS).
 * @param {boolean} [props.circleGuide=false] - Shows the circle a profile photo will be cut to.
 * @param {number} [props.maxSize=2048] - Longest side of the result in px (never enlarged).
 * @returns {JSX.Element}
 */
export function ImageCropDialog({ file, onCancel, onApply, title = "Crop image", defaultAspect = "free", circleGuide = false, maxSize = 2048 }) {
  return (
    <Dialog open={Boolean(file)} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="gap-4 rounded-2xl p-5 sm:max-w-xl sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-lg font-extrabold">{title}</DialogTitle>
          <DialogDescription className="text-[15px]">
            Drag the frame to move it, drag its edges or corners to resize, or use the whole image.
          </DialogDescription>
        </DialogHeader>
        {/* Remounted per file so each image starts fresh. */}
        {file && (
          <Cropper
            key={`${file.name}-${file.lastModified}-${file.size}`}
            file={file}
            onCancel={onCancel}
            onApply={onApply}
            defaultAspect={defaultAspect}
            circleGuide={circleGuide}
            maxSize={maxSize}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

/**
 * The interactive crop area and its controls for one file.
 *
 * @param {object} props - See ImageCropDialog.
 * @returns {JSX.Element}
 */
function Cropper({ file, onCancel, onApply, defaultAspect, circleGuide, maxSize }) {
  const [src, setSrc] = useState("");
  const [image, setImage] = useState(null); // natural size of the current (possibly rotated) image
  const [rect, setRect] = useState(null); // crop in image pixels
  const [aspectKey, setAspectKey] = useState(defaultAspect);
  const [stageWidth, setStageWidth] = useState(0);
  const [error, setError] = useState("");
  const [applying, setApplying] = useState(false);
  const [turn, setTurn] = useState(null); // rotate animation in progress (see rotate)
  const imgRef = useRef(null);
  const stageRef = useRef(null);
  const drag = useRef(null);

  // Read the file as a data URL inside the effect (safe under React Strict Mode's double run).
  useEffect(() => {
    let cancelled = false;
    const reader = new FileReader();
    reader.onload = () => !cancelled && setSrc(String(reader.result));
    reader.onerror = () => !cancelled && setError("This file couldn't be read. Try another image.");
    reader.readAsDataURL(file);
    return () => {
      cancelled = true;
      if (reader.readyState === FileReader.LOADING) reader.abort();
    };
  }, [file]);

  // Track the available width, so the image fits the dialog on any screen.
  useEffect(() => {
    const element = stageRef.current;
    if (!element) return undefined;
    const observer = new ResizeObserver(([entry]) => setStageWidth(entry.contentRect.width));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const preset = ASPECT_PRESETS.find((item) => item.key === aspectKey) ?? ASPECT_PRESETS[0];
  const aspect = image ? resolveAspect(preset.value, image) : null;
  const scale = image && stageWidth ? fitScale(image, stageWidth, MAX_STAGE_HEIGHT) : 0;
  const minCrop = scale ? Math.min(MIN_CROP_DISPLAY / scale, image.width, image.height) : 1;
  const shown = image && rect ? roundRect(rect, image) : null;

  /** Image loaded (or reloaded after rotating): start from the selected preset. */
  function handleLoad(event) {
    const size = { width: event.currentTarget.naturalWidth, height: event.currentTarget.naturalHeight };
    setImage(size);
    setRect(centeredRect(size, resolveAspect(preset.value, size)));
  }

  /** Picks an aspect preset and fits the largest centred crop with that shape. */
  function chooseAspect(key) {
    setAspectKey(key);
    if (!image) return;
    const value = ASPECT_PRESETS.find((item) => item.key === key)?.value ?? null;
    setRect(centeredRect(image, resolveAspect(value, image)));
  }

  /** Uses the whole image (switching to Free so nothing is cut). */
  function useFullImage() {
    if (!image) return;
    setAspectKey("free");
    setRect(fullRect(image));
  }

  /**
   * Rotates by 90° (lossless), then starts again from the selected preset. The current picture
   * turns and rescales with a CSS transition while the frame takes its new shape; the rotated
   * image is swapped in only once it is decoded and the animation has finished, so nothing flashes.
   */
  async function rotate(direction) {
    if (!imgRef.current || !image || !scale || turn) return;
    const rotated = { width: image.height, height: image.width };
    const newScale = fitScale(rotated, stageWidth, MAX_STAGE_HEIGHT);
    const url = rotateImage(imgRef.current, direction).toDataURL("image/png");
    const decoded = new Image();
    decoded.src = url;
    const duration = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : ROTATE_MS;

    if (duration) {
      const from = { width: image.width * scale, height: image.height * scale };
      setTurn({ duration, imgWidth: from.width, imgHeight: from.height, angle: 0, zoom: 1, ...from });
      await nextPaint();
      setTurn((current) => ({
        ...current,
        angle: direction * 90,
        zoom: newScale / scale,
        width: rotated.width * newScale,
        height: rotated.height * newScale,
      }));
    }
    await Promise.all([decoded.decode().catch(() => {}), wait(duration)]);
    setSrc(url);
    setImage(rotated);
    setRect(centeredRect(rotated, resolveAspect(preset.value, rotated)));
    setTurn(null);
  }

  /** Starts moving (mode "move") or resizing (a handle key) the crop. */
  function startDrag(event, mode) {
    if (!rect || !scale) return;
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { mode, startX: event.clientX, startY: event.clientY, startRect: rect };
  }

  /** Applies the pointer movement since the drag started. */
  function handlePointerMove(event) {
    const current = drag.current;
    if (!current) return;
    const dx = (event.clientX - current.startX) / scale;
    const dy = (event.clientY - current.startY) / scale;
    setRect(
      current.mode === "move"
        ? moveRect(current.startRect, dx, dy, image)
        : resizeRect(current.startRect, current.mode, dx, dy, image, aspect, minCrop),
    );
  }

  /** Arrow keys move the crop; Shift+arrows resize it from the bottom-right corner. */
  function handleKeyDown(event) {
    const steps = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
    if (!steps[event.key] || !rect) return;
    event.preventDefault();
    const step = Math.max(1, Math.min(image.width, image.height) * KEY_STEP);
    const [sx, sy] = steps[event.key];
    setRect(
      event.shiftKey
        ? resizeRect(rect, "se", sx * step, sy * step, image, aspect, minCrop)
        : moveRect(rect, sx * step, sy * step, image),
    );
  }

  /** Renders the crop and hands it to the parent. */
  async function apply() {
    if (!shown || !imgRef.current) return;
    setApplying(true);
    try {
      const type = file.type === "image/png" || file.type === "image/gif" ? "image/png" : "image/jpeg";
      const baseName = file.name.replace(/\.[^.]+$/, "") || "image";
      onApply(await renderCrop(imgRef.current, shown, { maxSize, type, name: `${baseName}-cropped` }));
    } catch {
      setError("This image couldn't be cropped. Try another one.");
      setApplying(false);
    }
  }

  const box = shown && scale && !turn ? { left: rect.x * scale, top: rect.y * scale, width: rect.w * scale, height: rect.h * scale } : null;

  return (
    <>
      {/* Padding leaves room for the handles, which sit half outside the frame at the image edges. */}
      <div ref={stageRef} className="flex w-full justify-center p-3">
        <div
          className={`relative rounded-sm select-none ${turn ? "" : "bg-foreground/90"}`}
          style={stageStyle(image, scale, turn)}
          onPointerMove={handlePointerMove}
          onPointerUp={() => (drag.current = null)}
          onPointerCancel={() => (drag.current = null)}
        >
          {src && (
            // eslint-disable-next-line @next/next/no-img-element -- local file preview drawn to a canvas; next/image cannot be used
            <img
              ref={imgRef}
              src={src}
              alt="Image being cropped"
              onLoad={handleLoad}
              onError={() => setError("This file couldn't be opened as an image.")}
              draggable={false}
              className="pointer-events-none block size-full"
              style={turn ? turningImageStyle(turn) : undefined}
            />
          )}
          {!image && !error && (
            <span className="absolute inset-0 flex items-center justify-center text-sm text-white/80" role="status">
              Loading image…
            </span>
          )}

          {/* Darken everything outside the crop with four rectangles (no clipping needed, so the
              handles stay fully visible even when the crop touches the image edges). */}
          {box && (
            <div className="pointer-events-none absolute inset-0" aria-hidden="true">
              <div className="absolute inset-x-0 top-0 bg-foreground/55" style={{ height: box.top }} />
              <div className="absolute inset-x-0 bottom-0 bg-foreground/55" style={{ top: box.top + box.height }} />
              <div className="absolute left-0 bg-foreground/55" style={{ top: box.top, height: box.height, width: box.left }} />
              <div className="absolute right-0 bg-foreground/55" style={{ top: box.top, height: box.height, left: box.left + box.width }} />
            </div>
          )}

          {box && (
            <div
              role="application"
              tabIndex={0}
              aria-label={`Crop area, ${shown.w} by ${shown.h} pixels. Drag to move; arrow keys move, Shift+arrow keys resize.`}
              onPointerDown={(event) => startDrag(event, "move")}
              onKeyDown={handleKeyDown}
              className="absolute cursor-move touch-none outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              style={box}
            >
              {/* Frame and rule-of-thirds guides */}
              <div className="pointer-events-none absolute inset-0 border-2 border-white" />
              <div className="pointer-events-none absolute inset-y-0 left-1/3 border-l border-white/40" />
              <div className="pointer-events-none absolute inset-y-0 left-2/3 border-l border-white/40" />
              <div className="pointer-events-none absolute inset-x-0 top-1/3 border-t border-white/40" />
              <div className="pointer-events-none absolute inset-x-0 top-2/3 border-t border-white/40" />
              {/* Round avatars show the centred circle of the crop, so the guide stays a circle. */}
              {circleGuide && (
                <div
                  className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-dashed border-primary"
                  style={{ width: Math.min(box.width, box.height), height: Math.min(box.width, box.height) }}
                />
              )}

              {Object.entries(HANDLES).map(([handle, [dirX, dirY]]) => (
                <span
                  key={handle}
                  data-handle={handle}
                  aria-hidden="true"
                  onPointerDown={(event) => startDrag(event, handle)}
                  className="absolute z-10 flex size-6 touch-none items-center justify-center"
                  style={{
                    left: `${(dirX + 1) * 50}%`,
                    top: `${(dirY + 1) * 50}%`,
                    transform: "translate(-50%, -50%)",
                    cursor: `${handle}-resize`,
                  }}
                >
                  <span className="size-3 rounded-[3px] border-2 border-foreground/70 bg-white shadow" />
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Aspect ratio">
            {ASPECT_PRESETS.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => chooseAspect(item.key)}
                aria-pressed={aspectKey === item.key}
                disabled={!image || Boolean(turn)}
                className="h-8 rounded-full border border-border px-3 text-[13px] font-semibold transition-colors hover:bg-brand-soft disabled:opacity-50 aria-pressed:border-brand-strong aria-pressed:bg-brand-soft aria-pressed:text-brand-strong"
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1">
              <ToolButton label="Use full image" onClick={useFullImage} disabled={!image || Boolean(turn)}>
                <Maximize className="size-4" aria-hidden="true" />
                Full image
              </ToolButton>
              <ToolButton label="Rotate left" onClick={() => rotate(-1)} disabled={!image || Boolean(turn)} iconOnly>
                <RotateCcw className="size-4" aria-hidden="true" />
              </ToolButton>
              <ToolButton label="Rotate right" onClick={() => rotate(1)} disabled={!image || Boolean(turn)} iconOnly>
                <RotateCw className="size-4" aria-hidden="true" />
              </ToolButton>
              <ToolButton label="Reset crop" onClick={() => chooseAspect(aspectKey)} disabled={!image || Boolean(turn)} iconOnly>
                <Undo2 className="size-4" aria-hidden="true" />
              </ToolButton>
            </div>
            <p className="text-[13px] text-muted-foreground tabular-nums" aria-live="polite">
              {shown ? `${shown.w} × ${shown.h} px` : ""}
            </p>
          </div>
        </div>
      )}

      <DialogFooter className="mx-0 mb-0 rounded-none border-0 bg-transparent p-0">
        <Button type="button" variant="outline" onClick={onCancel} className="h-10 rounded-[10px] px-4 text-[15px]">
          Cancel
        </Button>
        <Button type="button" onClick={apply} disabled={!shown || applying || Boolean(error) || Boolean(turn)} className="h-10 rounded-[10px] px-5 text-[15px] font-bold">
          {applying ? "Applying…" : "Apply"}
        </Button>
      </DialogFooter>
    </>
  );
}

/** Size of the crop area: the shown image, the animated frame while rotating, or a placeholder. */
function stageStyle(image, scale, turn) {
  if (turn) {
    const transition = `width ${turn.duration}ms ${ROTATE_EASING}, height ${turn.duration}ms ${ROTATE_EASING}`;
    return { width: turn.width, height: turn.height, transition };
  }
  return image && scale ? { width: image.width * scale, height: image.height * scale } : { width: "100%", height: 240 };
}

/** Keeps the old picture at its size, centred, while it turns and rescales into the new frame. */
function turningImageStyle(turn) {
  return {
    position: "absolute",
    left: "50%",
    top: "50%",
    width: turn.imgWidth,
    height: turn.imgHeight,
    maxWidth: "none",
    transform: `translate(-50%, -50%) rotate(${turn.angle}deg) scale(${turn.zoom})`,
    transition: `transform ${turn.duration}ms ${ROTATE_EASING}`,
  };
}

/**
 * Small outlined button for the cropper's tools.
 *
 * @param {object} props
 * @param {string} props.label - Accessible name and tooltip.
 * @param {() => void} props.onClick - Click handler.
 * @param {boolean} [props.disabled] - Disables the button.
 * @param {boolean} [props.iconOnly] - Square icon button.
 * @param {React.ReactNode} props.children - Icon (and text).
 * @returns {JSX.Element}
 */
function ToolButton({ label, onClick, disabled, iconOnly = false, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`inline-flex h-8 items-center justify-center gap-1.5 rounded-lg text-[13px] font-semibold text-foreground/80 transition-colors hover:bg-foreground/5 disabled:opacity-50 ${
        iconOnly ? "w-8" : "px-2.5"
      }`}
    >
      {children}
    </button>
  );
}
