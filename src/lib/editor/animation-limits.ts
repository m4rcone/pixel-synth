/**
 * Animated GIF limits. Kept apart from `animation.ts` so pages can quote
 * them without loading the GIF codec.
 */

/** Most frames an animated GIF may have. */
export const MAX_ANIMATION_FRAMES = 300;
/** Most decoded pixels (frames × width × height), about 100 MB of RGBA. */
export const MAX_ANIMATION_PIXELS = 25_000_000;
/** Animations are scaled down to fit the pixel budget, but not below this short side. */
export const MIN_ANIMATION_SIDE = 64;
