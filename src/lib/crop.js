/**
 * Geometry and rendering for the free-form image cropper. Pure functions working in the
 * image's natural pixels: a crop is a rectangle { x, y, w, h } that always stays inside the
 * image ({ width, height }). Aspect ratios are width / height; `null` means free.
 */

/** Aspect presets offered by the cropper. `original` is resolved from the image. */
export const ASPECT_PRESETS = [
  { key: "free", label: "Free", value: null },
  { key: "original", label: "Original", value: "original" },
  { key: "1:1", label: "1:1", value: 1 },
  { key: "4:3", label: "4:3", value: 4 / 3 },
  { key: "16:9", label: "16:9", value: 16 / 9 },
  { key: "3:4", label: "3:4", value: 3 / 4 },
];

/** Direction of each resize handle: -1 = left/top edge, 1 = right/bottom edge, 0 = centre. */
export const HANDLES = {
  nw: [-1, -1], n: [0, -1], ne: [1, -1],
  w: [-1, 0], e: [1, 0],
  sw: [-1, 1], s: [0, 1], se: [1, 1],
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

/**
 * Resolves a preset value to a number (or null for free).
 *
 * @param {number | "original" | null} value - Preset value.
 * @param {{ width: number, height: number }} image - Natural image size.
 * @returns {number | null} Aspect ratio, or null.
 */
export function resolveAspect(value, image) {
  return value === "original" ? image.width / image.height : value;
}

/**
 * The whole image as a crop.
 *
 * @param {{ width: number, height: number }} image - Natural image size.
 * @returns {{ x: number, y: number, w: number, h: number }} Full rectangle.
 */
export function fullRect(image) {
  return { x: 0, y: 0, w: image.width, h: image.height };
}

/**
 * The largest centred rectangle with the given aspect ratio (or the full image when free).
 *
 * @param {{ width: number, height: number }} image - Natural image size.
 * @param {number | null} aspect - Width / height, or null for free.
 * @returns {{ x: number, y: number, w: number, h: number }} Centred rectangle.
 */
export function centeredRect(image, aspect) {
  if (!aspect) return fullRect(image);
  let w = image.width;
  let h = w / aspect;
  if (h > image.height) {
    h = image.height;
    w = h * aspect;
  }
  return { x: (image.width - w) / 2, y: (image.height - h) / 2, w, h };
}

/**
 * Moves a crop by (dx, dy) without leaving the image.
 *
 * @param {{ x: number, y: number, w: number, h: number }} rect - Crop at the start of the drag.
 * @param {number} dx - Horizontal movement in image pixels.
 * @param {number} dy - Vertical movement in image pixels.
 * @param {{ width: number, height: number }} image - Natural image size.
 * @returns {{ x: number, y: number, w: number, h: number }} Moved crop.
 */
export function moveRect(rect, dx, dy, image) {
  return {
    ...rect,
    x: clamp(rect.x + dx, 0, image.width - rect.w),
    y: clamp(rect.y + dy, 0, image.height - rect.h),
  };
}

/**
 * Resizes a crop by dragging one of its handles by (dx, dy) from where the drag started.
 * The opposite edge or corner stays fixed (edges keep their centre); the crop never leaves the
 * image and never gets smaller than `min`. With an aspect ratio, the shape is kept.
 *
 * @param {{ x: number, y: number, w: number, h: number }} start - Crop at the start of the drag.
 * @param {keyof HANDLES} handle - Handle being dragged.
 * @param {number} dx - Horizontal movement in image pixels since the drag started.
 * @param {number} dy - Vertical movement in image pixels since the drag started.
 * @param {{ width: number, height: number }} image - Natural image size.
 * @param {number | null} aspect - Width / height to keep, or null for free.
 * @param {number} min - Smallest width/height in image pixels.
 * @returns {{ x: number, y: number, w: number, h: number }} Resized crop.
 */
export function resizeRect(start, handle, dx, dy, image, aspect, min) {
  const [dirX, dirY] = HANDLES[handle];
  const left = start.x;
  const top = start.y;
  const right = start.x + start.w;
  const bottom = start.y + start.h;

  if (!aspect) {
    let x1 = left;
    let x2 = right;
    let y1 = top;
    let y2 = bottom;
    if (dirX === 1) x2 = clamp(right + dx, left + min, image.width);
    if (dirX === -1) x1 = clamp(left + dx, 0, right - min);
    if (dirY === 1) y2 = clamp(bottom + dy, top + min, image.height);
    if (dirY === -1) y1 = clamp(top + dy, 0, bottom - min);
    return { x: x1, y: y1, w: x2 - x1, h: y2 - y1 };
  }

  // Fixed point: the opposite corner, or the centre of the opposite edge.
  const anchorX = dirX === 1 ? left : dirX === -1 ? right : left + start.w / 2;
  const anchorY = dirY === 1 ? top : dirY === -1 ? bottom : top + start.h / 2;

  // Requested width from the drag; corners follow whichever axis moved more.
  let w;
  if (dirX !== 0 && dirY !== 0) w = Math.max(start.w + dirX * dx, (start.h + dirY * dy) * aspect);
  else if (dirX !== 0) w = start.w + dirX * dx;
  else w = (start.h + dirY * dy) * aspect;

  // Room available from the fixed point in each direction.
  const roomX = dirX === 1 ? image.width - anchorX : dirX === -1 ? anchorX : 2 * Math.min(anchorX, image.width - anchorX);
  const roomY = dirY === 1 ? image.height - anchorY : dirY === -1 ? anchorY : 2 * Math.min(anchorY, image.height - anchorY);
  const minW = Math.max(min, min * aspect);
  w = clamp(w, Math.min(minW, roomX, roomY * aspect), Math.min(roomX, roomY * aspect));
  const h = w / aspect;

  const x = dirX === 1 ? anchorX : dirX === -1 ? anchorX - w : anchorX - w / 2;
  const y = dirY === 1 ? anchorY : dirY === -1 ? anchorY - h : anchorY - h / 2;
  return { x, y, w, h };
}

/**
 * Size of the image drawn to fit inside a box (never enlarged).
 *
 * @param {{ width: number, height: number }} image - Natural image size.
 * @param {number} maxWidth - Available width in px.
 * @param {number} maxHeight - Available height in px.
 * @returns {number} Display scale (display px per image px).
 */
export function fitScale(image, maxWidth, maxHeight) {
  return Math.min(1, maxWidth / image.width, maxHeight / image.height);
}

/**
 * Rounds a crop to whole pixels, staying inside the image.
 *
 * @param {{ x: number, y: number, w: number, h: number }} rect - Crop.
 * @param {{ width: number, height: number }} image - Natural image size.
 * @returns {{ x: number, y: number, w: number, h: number }} Integer crop.
 */
export function roundRect(rect, image) {
  const x = clamp(Math.round(rect.x), 0, image.width - 1);
  const y = clamp(Math.round(rect.y), 0, image.height - 1);
  return { x, y, w: clamp(Math.round(rect.w), 1, image.width - x), h: clamp(Math.round(rect.h), 1, image.height - y) };
}

/** Encodes a canvas as a Blob. */
function toBlob(canvas, type, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Could not encode the image"))), type, quality);
  });
}

/**
 * Draws the crop of an image into a file. The result is scaled down (never up) so its longest
 * side is at most `maxSize`. PNG sources stay PNG (keeping transparency) unless that would
 * exceed `maxBytes`, in which case a JPEG is produced instead.
 *
 * @param {HTMLImageElement | HTMLCanvasElement} source - Loaded source.
 * @param {{ x: number, y: number, w: number, h: number }} rect - Integer crop in source pixels.
 * @param {{ maxSize?: number, maxBytes?: number, type?: string, name?: string }} [options]
 * @returns {Promise<File>} Cropped image file.
 */
export async function renderCrop(source, rect, { maxSize = 2048, maxBytes = 5 * 1024 * 1024, type = "image/jpeg", name = "image" } = {}) {
  const ratio = Math.min(1, maxSize / Math.max(rect.w, rect.h));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(rect.w * ratio));
  canvas.height = Math.max(1, Math.round(rect.h * ratio));
  const ctx = canvas.getContext("2d");
  const png = type === "image/png";
  if (!png) {
    // JPEG has no transparency; paint white so transparent areas do not turn black.
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(source, rect.x, rect.y, rect.w, rect.h, 0, 0, canvas.width, canvas.height);

  let blob = await toBlob(canvas, png ? "image/png" : "image/jpeg", 0.92);
  let outType = blob.type || (png ? "image/png" : "image/jpeg");
  if (blob.size > maxBytes) {
    const flat = document.createElement("canvas");
    flat.width = canvas.width;
    flat.height = canvas.height;
    const flatCtx = flat.getContext("2d");
    flatCtx.fillStyle = "#ffffff";
    flatCtx.fillRect(0, 0, flat.width, flat.height);
    flatCtx.drawImage(canvas, 0, 0);
    blob = await toBlob(flat, "image/jpeg", 0.85);
    outType = "image/jpeg";
  }
  const ext = outType === "image/png" ? "png" : "jpg";
  return new File([blob], `${name}.${ext}`, { type: outType });
}

/**
 * Rotates an image by 90° steps into a new canvas (lossless; nothing is re-encoded).
 *
 * @param {HTMLImageElement | HTMLCanvasElement} source - Loaded source.
 * @param {1 | -1} direction - 1 = clockwise, -1 = counter-clockwise.
 * @returns {HTMLCanvasElement} Rotated image.
 */
export function rotateImage(source, direction) {
  const width = source.naturalWidth ?? source.width;
  const height = source.naturalHeight ?? source.height;
  const canvas = document.createElement("canvas");
  canvas.width = height;
  canvas.height = width;
  const ctx = canvas.getContext("2d");
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((direction * Math.PI) / 2);
  ctx.drawImage(source, -width / 2, -height / 2);
  return canvas;
}
