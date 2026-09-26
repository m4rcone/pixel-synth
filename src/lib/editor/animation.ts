import { decodeGif, readGifInfo } from "./gif/decode";
import { encodeGif } from "./gif/encode";
import {
  MAX_ANIMATION_FRAMES,
  MAX_ANIMATION_PIXELS,
  MIN_ANIMATION_SIDE,
} from "./animation-limits";
import { GifLimitError, TooManyColorsError } from "./gif/errors";
import type { Pixels } from "./pixels";
import { MAX_IMAGE_SIZE } from "./resize";

export { MAX_ANIMATION_FRAMES, MAX_ANIMATION_PIXELS, MIN_ANIMATION_SIDE };

export type Animation = {
  /** Every frame, coalesced, all the same size. */
  frames: Pixels[];
  /** Display time of each frame in milliseconds. */
  delays: number[];
  /** How many times the animation plays; 0 = forever. */
  loop: number;
};

/**
 * Size every frame is decoded at: first down to {@link MAX_IMAGE_SIZE} like
 * still images, then uniformly down to the pixel budget. Throws a
 * {@link GifLimitError} past the frame limit, or when fitting the budget
 * would take the short side below {@link MIN_ANIMATION_SIDE}.
 */
export function animationSize(width: number, height: number, frames: number) {
  if (frames > MAX_ANIMATION_FRAMES) {
    throw new GifLimitError("frames", MAX_ANIMATION_FRAMES);
  }
  let scale = Math.min(1, MAX_IMAGE_SIZE / Math.max(width, height));
  const area = frames * width * height * scale * scale;
  if (area > MAX_ANIMATION_PIXELS) {
    scale *= Math.sqrt(MAX_ANIMATION_PIXELS / area);
    if (Math.min(width, height) * scale < MIN_ANIMATION_SIDE) {
      throw new GifLimitError("pixels", MAX_ANIMATION_PIXELS);
    }
  }
  const size = {
    width: Math.max(1, Math.floor(width * scale)),
    height: Math.max(1, Math.floor(height * scale)),
  };
  return size;
}

/**
 * Decodes an animated GIF into equally sized frames within the limits.
 * Returns null for a GIF with a single frame (loaded like any still image).
 */
export function decodeAnimation(bytes: Uint8Array): Animation | null {
  const info = readGifInfo(bytes);
  if (info.frames <= 1) return null;
  const size = animationSize(info.width, info.height, info.frames);
  const gif = decodeGif(bytes, {
    maxFrames: MAX_ANIMATION_FRAMES,
    maxPixels: MAX_ANIMATION_PIXELS,
    size,
  });
  if (gif.frames.length <= 1) return null;
  return {
    frames: gif.frames.map(({ data }) => ({
      data,
      width: gif.width,
      height: gif.height,
    })),
    delays: gif.frames.map((frame) => frame.delay),
    loop: gif.loop,
  };
}

/**
 * Encodes rendered frames as an animated GIF, enlarged `factor` times
 * (nearest-neighbor). The color table is the colors the frames actually use;
 * pixels with alpha below 128 share one transparent entry.
 */
export function encodeAnimation(
  frames: Pixels[],
  delays: number[],
  loop: number,
  factor = 1,
  onProgress?: (done: number, total: number) => void,
): Uint8Array<ArrayBuffer> {
  const { width, height } = frames[0];
  const lookup = new Map<number, number>();
  const palette: number[] = [];
  const TRANSPARENT = -1;
  let transparentIndex: number | undefined;

  const indexed = frames.map(({ data }) => {
    const indices = new Uint8Array(width * height);
    for (let p = 0, i = 0; p < indices.length; p++, i += 4) {
      const key =
        data[i + 3] < 128
          ? TRANSPARENT
          : (data[i] << 16) | (data[i + 1] << 8) | data[i + 2];
      let index = lookup.get(key);
      if (index === undefined) {
        if (lookup.size === 256) {
          throw new TooManyColorsError("More than 256 colors");
        }
        index = lookup.size;
        lookup.set(key, index);
        if (key === TRANSPARENT) {
          transparentIndex = index;
          palette.push(0, 0, 0);
        } else {
          palette.push(data[i], data[i + 1], data[i + 2]);
        }
      }
      indices[p] = index;
    }
    return indices;
  });

  // Enlarged one frame at a time, as the encoder asks for it.
  function* enlarged() {
    for (let f = 0; f < indexed.length; f++) {
      onProgress?.(f, frames.length);
      yield {
        indices:
          factor > 1 ? enlarge(indexed[f], width, height, factor) : indexed[f],
        delay: delays[f],
      };
    }
  }
  const bytes = encodeGif({
    width: width * factor,
    height: height * factor,
    palette: Uint8Array.from(palette),
    frames: enlarged(),
    loop,
    transparentIndex,
  });
  onProgress?.(frames.length, frames.length);
  return bytes;
}

/** Nearest-neighbor enlargement of an index buffer. */
function enlarge(
  indices: Uint8Array,
  width: number,
  height: number,
  factor: number,
) {
  const outWidth = width * factor;
  const out = new Uint8Array(outWidth * height * factor);
  const row = new Uint8Array(outWidth);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      row.fill(indices[y * width + x], x * factor, (x + 1) * factor);
    }
    for (let k = 0; k < factor; k++) {
      out.set(row, (y * factor + k) * outWidth);
    }
  }
  return out;
}
