export function downscaleImage(
  image: HTMLImageElement | ImageBitmap,
  factor: number,
): HTMLCanvasElement {
  const scaledWidth = Math.floor(image.width * factor);
  const scaledHeight = Math.floor(image.height * factor);

  const processedCanvas = document.createElement("canvas");
  processedCanvas.width = scaledWidth;
  processedCanvas.height = scaledHeight;

  const ctx = processedCanvas.getContext("2d", {
    willReadFrequently: true,
  })!;

  // ✅ Hardware accelerated downscale
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  ctx.drawImage(image, 0, 0, scaledWidth, scaledHeight);

  return processedCanvas;
}

export function upscaleImage(
  canvas: HTMLCanvasElement,
  targetWidth: number,
  targetHeight: number,
): HTMLCanvasElement {
  const processedCanvas = document.createElement("canvas");
  processedCanvas.width = targetWidth;
  processedCanvas.height = targetHeight;
  const ctx = processedCanvas.getContext("2d", { willReadFrequently: true })!;

  // ✅ Use nearest-neighbor to keep pixels defined.
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(canvas, 0, 0, targetWidth, targetHeight);

  return processedCanvas;
}
