/**
 * The mark and colors outside CSS: the logo component, the social cards and
 * the generated icons (scripts/generate-previews.mjs) read them from here.
 * Keep the colors equal to the tokens in src/app/globals.css.
 */

/**
 * The mark: a left-to-right ramp through a 4×4 Bayer matrix, literally the
 * output of an ordered-dither threshold map. [column, row] of each lit cell.
 */
export const MARK_CELLS: readonly (readonly [number, number])[] = [
  [0, 0],
  [2, 0],
  [3, 0],
  [1, 1],
  [3, 1],
  [2, 2],
  [3, 2],
  [3, 3],
];

export const BRAND_COLORS = {
  /** `--ink`: screen, page background. */
  ink: "#05080d",
  /** `--ink-sunken`: neutral image well. */
  inkSunken: "#0b0b0b",
  /** `--paper`: scan text. */
  paper: "#cfe6ff",
  /** `--paper-dim`: secondary text, rulers. */
  paperDim: "#7b9cbc",
  /** `--safelight`: the reticle accent. */
  safelight: "#ffd23f",
  /** `--line-strong`. */
  lineStrong: "rgba(207, 230, 255, 0.34)",
} as const;
