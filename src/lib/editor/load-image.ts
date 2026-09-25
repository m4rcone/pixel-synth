import type { Pixels } from "./pixels";

/** Longest edge, in pixels, an uploaded image is scaled down to. */
export const MAX_IMAGE_SIZE = 2000;

export type SourceImage = {
  /** Decoded image for display. */
  bitmap: ImageBitmap;
  /** RGBA pixels handed to the render pipeline. */
  pixels: Pixels;
  name: string;
};

/** Raster formats every current browser decodes with createImageBitmap. */
export const SUPPORTED_IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "image/avif",
  "image/bmp",
] as const;

export const SUPPORTED_FORMATS_LABEL = "PNG, JPEG, WebP, GIF, AVIF or BMP";

export class ImageLoadError extends Error {}

/**
 * Decodes an image file locally (EXIF orientation applied) and scales it down
 * so its longest edge is at most {@link MAX_IMAGE_SIZE}. Throws an
 * {@link ImageLoadError} with a user-facing message when the file can't be used.
 */
export async function loadImageFile(file: File): Promise<SourceImage> {
  if (file.type === "image/svg+xml") {
    throw new ImageLoadError(
      `SVG files aren’t supported. Export “${file.name}” as PNG and try again.`,
    );
  }
  if (!file.type.startsWith("image/")) {
    throw new ImageLoadError(
      `“${file.name}” is not an image. Choose a ${SUPPORTED_FORMATS_LABEL} file.`,
    );
  }

  let decoded: ImageBitmap;
  try {
    decoded = await createImageBitmap(file);
  } catch {
    throw new ImageLoadError(
      `Your browser can’t read “${file.name}”. Convert it to PNG or JPEG and try again.`,
    );
  }

  const scale = Math.min(
    1,
    MAX_IMAGE_SIZE / Math.max(decoded.width, decoded.height),
  );
  const width = Math.max(1, Math.round(decoded.width * scale));
  const height = Math.max(1, Math.round(decoded.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new ImageLoadError("Could not prepare the image.");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(decoded, 0, 0, width, height);
  decoded.close();

  const { data } = ctx.getImageData(0, 0, width, height);
  const bitmap = await createImageBitmap(canvas);

  return { bitmap, pixels: { data, width, height }, name: file.name };
}
