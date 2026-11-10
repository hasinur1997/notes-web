/**
 * Geometry for the square photo cropper. Pure functions, in "stage pixels": the image is shown
 * inside a square stage of side `stage`, scaled by `scale` and offset by its top-left corner (x, y).
 * The image must always cover the whole stage, so the crop never contains empty space.
 */

/** Largest zoom relative to the "just covers the stage" size. */
export const MAX_ZOOM = 4;

/**
 * Scale at which the image just covers the stage (the smallest allowed scale).
 *
 * @param {{ width: number, height: number }} image - Natural image size.
 * @param {number} stage - Stage side in px.
 * @returns {number} Cover scale.
 */
export function coverScale({ width, height }, stage) {
  return Math.max(stage / width, stage / height);
}

/**
 * Keeps the image covering the stage: x and y are clamped so no edge shows inside it.
 *
 * @param {{ x: number, y: number }} offset - Proposed top-left of the image.
 * @param {{ width: number, height: number }} image - Natural image size.
 * @param {number} scale - Current scale.
 * @param {number} stage - Stage side in px.
 * @returns {{ x: number, y: number }} Clamped offset.
 */
export function clampOffset({ x, y }, image, scale, stage) {
  const minX = stage - image.width * scale;
  const minY = stage - image.height * scale;
  return { x: Math.min(0, Math.max(minX, x)), y: Math.min(0, Math.max(minY, y)) };
}

/**
 * Starting position: zoomed to cover and centred.
 *
 * @param {{ width: number, height: number }} image - Natural image size.
 * @param {number} stage - Stage side in px.
 * @returns {{ zoom: number, x: number, y: number }} Initial view.
 */
export function initialView(image, stage) {
  const scale = coverScale(image, stage);
  return { zoom: 1, x: (stage - image.width * scale) / 2, y: (stage - image.height * scale) / 2 };
}

/**
 * Changes the zoom while keeping the point under the stage centre fixed, then clamps.
 *
 * @param {{ zoom: number, x: number, y: number }} view - Current view.
 * @param {number} nextZoom - Requested zoom (clamped to 1…MAX_ZOOM).
 * @param {{ width: number, height: number }} image - Natural image size.
 * @param {number} stage - Stage side in px.
 * @returns {{ zoom: number, x: number, y: number }} New view.
 */
export function zoomView(view, nextZoom, image, stage) {
  const base = coverScale(image, stage);
  const zoom = Math.min(MAX_ZOOM, Math.max(1, nextZoom));
  const oldScale = base * view.zoom;
  const newScale = base * zoom;
  const centre = stage / 2;
  // Image coordinates of the stage centre stay under the centre after zooming.
  const imageX = (centre - view.x) / oldScale;
  const imageY = (centre - view.y) / oldScale;
  const offset = clampOffset({ x: centre - imageX * newScale, y: centre - imageY * newScale }, image, newScale, stage);
  return { zoom, ...offset };
}

/**
 * Moves the image by (dx, dy) stage pixels, then clamps.
 *
 * @param {{ zoom: number, x: number, y: number }} view - Current view.
 * @param {number} dx - Horizontal movement.
 * @param {number} dy - Vertical movement.
 * @param {{ width: number, height: number }} image - Natural image size.
 * @param {number} stage - Stage side in px.
 * @returns {{ zoom: number, x: number, y: number }} New view.
 */
export function panView(view, dx, dy, image, stage) {
  const scale = coverScale(image, stage) * view.zoom;
  return { zoom: view.zoom, ...clampOffset({ x: view.x + dx, y: view.y + dy }, image, scale, stage) };
}

/**
 * The square of the original image that is visible in the stage, in natural pixels.
 *
 * @param {{ zoom: number, x: number, y: number }} view - Current view.
 * @param {{ width: number, height: number }} image - Natural image size.
 * @param {number} stage - Stage side in px.
 * @returns {{ sx: number, sy: number, size: number }} Source square to draw.
 */
export function cropRect(view, image, stage) {
  const scale = coverScale(image, stage) * view.zoom;
  const size = Math.min(stage / scale, image.width, image.height);
  return {
    sx: Math.min(Math.max(0, -view.x / scale), image.width - size),
    sy: Math.min(Math.max(0, -view.y / scale), image.height - size),
    size,
  };
}

/**
 * Draws the cropped square into a canvas and encodes it as a JPEG file.
 * A white background is painted first, so transparent PNGs do not turn black.
 *
 * @param {HTMLImageElement} img - Loaded source image.
 * @param {{ sx: number, sy: number, size: number }} rect - Source square (from cropRect).
 * @param {number} [outputSize=512] - Side of the resulting image in px.
 * @returns {Promise<File>} "avatar.jpg" ready to upload.
 */
export function renderCrop(img, rect, outputSize = 512) {
  const side = Math.round(Math.min(outputSize, Math.max(64, rect.size)));
  const canvas = document.createElement("canvas");
  canvas.width = side;
  canvas.height = side;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, side, side);
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, rect.sx, rect.sy, rect.size, rect.size, 0, 0, side, side);
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(new File([blob], "avatar.jpg", { type: "image/jpeg" })) : reject(new Error("Could not crop the image"))),
      "image/jpeg",
      0.9,
    );
  });
}
