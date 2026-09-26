/** Export enlargement factors offered by the save dialog. */
export const EXPORT_FACTORS = [1, 2, 4, 8] as const;
export type ExportFactor = (typeof EXPORT_FACTORS)[number];

/**
 * Largest canvas every current desktop browser can draw: Firefox caps the
 * area at about 11,180 × 11,180 px (Chrome and Safari allow ~268 M px) and
 * all cap a side at 32,767 px. iOS Safari is lower still (~16.7 M px), so
 * the save dialog also reports a failed export instead of relying on this.
 */
export const MAX_EXPORT_AREA = 11_180 * 11_180;
export const MAX_EXPORT_SIDE = 32_767;

export function exportFits(width: number, height: number, factor: number) {
  const w = width * factor;
  const h = height * factor;
  return (
    w <= MAX_EXPORT_SIDE && h <= MAX_EXPORT_SIDE && w * h <= MAX_EXPORT_AREA
  );
}

/** Suggested size: the largest factor that keeps the longest side ≤ ~1000 px. */
export function defaultExportFactor(
  width: number,
  height: number,
): ExportFactor {
  const longest = Math.max(width, height);
  return (
    [...EXPORT_FACTORS]
      .reverse()
      .find((k) => longest * k <= 1000 && exportFits(width, height, k)) ?? 1
  );
}
