/** Longest edge, in pixels, an uploaded image is scaled down to. */
export const MAX_IMAGE_SIZE = 2000;

export class ImageLoadError extends Error {}

function decode(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new ImageLoadError("decode"));
    image.src = src;
  });
}

/**
 * Decodes an image file locally and scales it down so its longest edge is at
 * most {@link MAX_IMAGE_SIZE}. Throws an {@link ImageLoadError} with a
 * user-facing message when the file cannot be used.
 */
export async function loadImageFile(file: File): Promise<HTMLImageElement> {
  if (!file.type.startsWith("image/")) {
    throw new ImageLoadError(
      `“${file.name}” is not an image. Choose a PNG, JPEG, WebP or GIF file.`,
    );
  }

  const url = URL.createObjectURL(file);
  let image: HTMLImageElement;
  try {
    image = await decode(url);
  } catch {
    URL.revokeObjectURL(url);
    throw new ImageLoadError(
      `Your browser can’t read “${file.name}”. Try converting it to PNG or JPEG.`,
    );
  }

  const { naturalWidth: width, naturalHeight: height } = image;
  // Small images keep their object URL alive: the element is the source.
  if (width <= MAX_IMAGE_SIZE && height <= MAX_IMAGE_SIZE) return image;

  const scale = Math.min(MAX_IMAGE_SIZE / width, MAX_IMAGE_SIZE / height);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new ImageLoadError("Could not prepare the image.");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  URL.revokeObjectURL(url);

  return decode(canvas.toDataURL("image/png"));
}
