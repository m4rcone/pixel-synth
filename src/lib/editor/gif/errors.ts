/**
 * Errors shared by the GIF code in the worker and the main thread. Kept
 * apart from the codec so the main bundle can recognize them without
 * loading it.
 */

/** Not a GIF, or damaged before its first complete frame. */
export class GifFormatError extends Error {}

/** The GIF has more frames or pixels than the caller allows. */
export class GifLimitError extends Error {
  constructor(
    readonly limit: "frames" | "pixels",
    readonly max: number,
  ) {
    super(`GIF over the ${limit} limit (${max})`);
  }
}

/** Frame colors don't fit the 256 entries of a GIF color table. */
export class TooManyColorsError extends Error {}
