import type { Animation } from "./animation";
import { GifLimitError } from "./gif/errors";
import type { Pixels } from "./pixels";
import { MAX_IMAGE_SIZE } from "./resize";

export { MAX_IMAGE_SIZE };

export type SourceImage = {
  /** Decoded image for display (the first frame of an animation). */
  bitmap: ImageBitmap;
  /** RGBA pixels handed to the render pipeline (the first frame of an animation). */
  pixels: Pixels;
  name: string;
  /** Every frame of an animated GIF, all the size of `pixels`. */
  animation?: Animation & { bitmaps: ImageBitmap[] };
};

/** Decodes animated GIFs off the main thread (see RenderClient). */
export type AnimationDecoder = {
  decodeAnimation(bytes: Uint8Array<ArrayBuffer>): Promise<Animation | null>;
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

/** The formats, noting that GIFs may be animated. */
export const SUPPORTED_FORMATS_DETAIL = SUPPORTED_FORMATS_LABEL.replace(
  "GIF",
  "GIF (animated too)",
);

export class ImageLoadError extends Error {}

async function isGifFile(file: File) {
  if (file.type === "image/gif") return true;
  const magic = new Uint8Array(await file.slice(0, 4).arrayBuffer());
  return String.fromCharCode(...magic) === "GIF8";
}

/**
 * Decodes an image file locally (EXIF orientation applied) and scales it down
 * so its longest edge is at most {@link MAX_IMAGE_SIZE}. An animated GIF is
 * decoded frame by frame with `decoder` (within the animation limits).
 * Throws an {@link ImageLoadError} with a user-facing message when the file
 * can't be used.
 */
export async function loadImageFile(
  file: File,
  decoder?: AnimationDecoder,
): Promise<SourceImage> {
  if (file.type === "image/svg+xml") {
    throw new ImageLoadError(
      `SVG files aren’t supported. Export “${file.name}” as PNG and try again.`,
    );
  }
  const gif = await isGifFile(file);
  if (!file.type.startsWith("image/") && !gif) {
    throw new ImageLoadError(
      `“${file.name}” is not an image. Choose a ${SUPPORTED_FORMATS_LABEL} file.`,
    );
  }

  if (decoder && gif) {
    const animated = await loadAnimation(file, decoder);
    if (animated) return animated;
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
  if (!ctx) throw new ImageLoadError("Couldn’t prepare the image.");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(decoded, 0, 0, width, height);
  decoded.close();

  const { data } = ctx.getImageData(0, 0, width, height);
  const bitmap = await createImageBitmap(canvas);

  return { bitmap, pixels: { data, width, height }, name: file.name };
}

/**
 * Every frame of an animated GIF, or null for a single-frame GIF or one the
 * decoder can't read (the browser's own decoder gets a chance at it).
 */
async function loadAnimation(
  file: File,
  decoder: AnimationDecoder,
): Promise<SourceImage | null> {
  let animation: Animation | null;
  try {
    animation = await decoder.decodeAnimation(
      new Uint8Array(await file.arrayBuffer()),
    );
  } catch (error) {
    if (!(error instanceof GifLimitError)) return null;
    throw new ImageLoadError(
      error.limit === "frames"
        ? `“${file.name}” has more than ${error.max} frames, the most an animation can have here. Trim the GIF and try again.`
        : `“${file.name}” is too large to animate here: ${error.max / 1_000_000} million pixels across all frames at most. Trim frames or reduce its size and try again.`,
    );
  }
  if (!animation) return null;

  const bitmaps = await Promise.all(
    animation.frames.map(({ data, width, height }) =>
      createImageBitmap(new ImageData(data, width, height)),
    ),
  );
  return {
    bitmap: await createImageBitmap(bitmaps[0]),
    pixels: animation.frames[0],
    name: file.name,
    animation: { ...animation, bitmaps },
  };
}
