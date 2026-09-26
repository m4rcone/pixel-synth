import { isAlgorithmId } from "@/lib/algorithms";
import {
  isPaletteId,
  MAX_PALETTE_COLORS,
  MIN_PALETTE_COLORS,
} from "@/lib/palettes";
import {
  DEFAULT_SETTINGS,
  FILTER_LIMITS,
  MIN_SCALE,
  SCREEN_LIMITS,
  SCREEN_SHAPES,
  type EditorSettings,
  type Filters,
  type ToneSlot,
} from "./settings";

/**
 * Settings links: `/editor?s=<code>`. The code is base64url JSON holding only
 * what differs from the defaults, plus whether dithering was applied. It never
 * carries the image. Decoding treats the value as untrusted: every field is
 * validated and clamped, unknown fields are ignored.
 */
export const SHARE_PARAM = "s";

const VERSION = 1;

export type SharedSettings = {
  /** Complete settings: the defaults with the shared changes applied. */
  settings: EditorSettings;
  /** The custom palette, only when the link carries one. */
  custom: string[] | null;
  /** Dithering was applied when the link was made. */
  dithered: boolean;
};

type Diff = Record<string, unknown>;

const TONE_SLOTS: ToneSlot[] = ["highlights", "midtones", "shadows"];
const HEX = /^#[0-9a-f]{6}$/i;

function diffObject<T extends object>(value: T, base: T): Diff | undefined {
  const diff: Diff = {};
  for (const key of Object.keys(value) as (keyof T)[]) {
    if (JSON.stringify(value[key]) !== JSON.stringify(base[key])) {
      diff[key as string] = value[key];
    }
  }
  return Object.keys(diff).length ? diff : undefined;
}

export function encodeSettings(
  settings: EditorSettings,
  dithered: boolean,
): string {
  const base = DEFAULT_SETTINGS;
  const { custom, ...color } = settings.color;
  const { custom: baseCustom, ...baseColor } = base.color;
  const tones: Diff = {};
  for (const slot of TONE_SLOTS) {
    const diff = diffObject(settings.tones[slot], base.tones[slot]);
    if (diff) tones[slot] = diff;
  }

  const data: Diff = {
    v: VERSION,
    ...(dithered ? { d: 1 } : {}),
    ...(settings.algorithm !== base.algorithm
      ? { algorithm: settings.algorithm }
      : {}),
    ...(settings.scale !== base.scale ? { scale: settings.scale } : {}),
    ...(settings.diffusion !== base.diffusion
      ? { diffusion: settings.diffusion }
      : {}),
    ...(diffObject(settings.screen, base.screen)
      ? { screen: diffObject(settings.screen, base.screen) }
      : {}),
    ...(diffObject(settings.filters, base.filters)
      ? { filters: diffObject(settings.filters, base.filters) }
      : {}),
    ...(settings.colorCount !== base.colorCount
      ? { colorCount: settings.colorCount }
      : {}),
    // null (transparent) survives JSON as null.
    ...(settings.background !== base.background
      ? { background: settings.background }
      : {}),
    ...(Object.keys(tones).length ? { tones } : {}),
    ...(diffObject(color, baseColor)
      ? { color: diffObject(color, baseColor) }
      : {}),
    // Only needed to reproduce a custom palette.
    ...(settings.color.palette === "custom" &&
    JSON.stringify(custom) !== JSON.stringify(baseCustom)
      ? { custom }
      : {}),
  };

  return btoa(JSON.stringify(data))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

const isObject = (value: unknown): value is Diff =>
  typeof value === "object" && value !== null && !Array.isArray(value);

function number(value: unknown, min: number, max: number) {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.min(max, Math.max(min, value))
    : undefined;
}

function oneOf<T extends string>(value: unknown, options: readonly T[]) {
  return options.includes(value as T) ? (value as T) : undefined;
}

function colors(value: unknown) {
  return Array.isArray(value) &&
    value.length >= MIN_PALETTE_COLORS &&
    value.length <= MAX_PALETTE_COLORS &&
    value.every((c) => typeof c === "string" && HEX.test(c))
    ? (value as string[])
    : undefined;
}

/** Parses a settings code; null when it isn't one this version can read. */
export function decodeSettings(code: string): SharedSettings | null {
  let data: unknown;
  try {
    const base64 = code.replace(/-/g, "+").replace(/_/g, "/");
    data = JSON.parse(atob(base64));
  } catch {
    return null;
  }
  if (!isObject(data) || data.v !== VERSION) return null;

  const base = DEFAULT_SETTINGS;
  const settings: EditorSettings = structuredClone(base);

  const algorithm = data.algorithm;
  if (
    typeof algorithm === "string" &&
    (algorithm === "none" || isAlgorithmId(algorithm))
  ) {
    settings.algorithm = algorithm;
  }
  settings.scale = number(data.scale, MIN_SCALE, 1) ?? base.scale;
  settings.diffusion = number(data.diffusion, 0, 1) ?? base.diffusion;

  if (isObject(data.screen)) {
    const { screen } = data;
    const { size, angle, displace, wave, wavelength } = SCREEN_LIMITS;
    const cell = number(screen.size, size.min, size.max);
    if (cell !== undefined) settings.screen.size = Math.round(cell);
    settings.screen.angle =
      number(screen.angle, angle.min, angle.max) ?? base.screen.angle;
    settings.screen.shape =
      oneOf(screen.shape, SCREEN_SHAPES) ?? base.screen.shape;
    settings.screen.displace =
      number(screen.displace, displace.min, displace.max) ??
      base.screen.displace;
    settings.screen.wave =
      number(screen.wave, wave.min, wave.max) ?? base.screen.wave;
    settings.screen.wavelength =
      number(screen.wavelength, wavelength.min, wavelength.max) ??
      base.screen.wavelength;
  }

  if (isObject(data.filters)) {
    for (const key of Object.keys(FILTER_LIMITS) as (keyof Filters)[]) {
      const { min, max } = FILTER_LIMITS[key];
      settings.filters[key] =
        number(data.filters[key], min, max) ?? base.filters[key];
    }
  }

  const colorCount = data.colorCount;
  if (colorCount === 1 || colorCount === 2 || colorCount === 3) {
    settings.colorCount = colorCount;
  }
  if (data.background === null) {
    settings.background = null;
  } else if (typeof data.background === "string" && HEX.test(data.background)) {
    settings.background = data.background;
  }

  if (isObject(data.tones)) {
    for (const slot of TONE_SLOTS) {
      const tone = data.tones[slot];
      if (!isObject(tone)) continue;
      if (typeof tone.color === "string" && HEX.test(tone.color)) {
        settings.tones[slot].color = tone.color;
      }
      // Highlights always end at 255.
      const range = number(tone.range, 0, 255);
      if (range !== undefined && slot !== "highlights") {
        settings.tones[slot].range = Math.round(range);
      }
    }
  }

  if (isObject(data.color)) {
    const { color } = data;
    settings.color.mode =
      oneOf(color.mode, ["mono", "palette"] as const) ?? base.color.mode;
    if (typeof color.palette === "string" && isPaletteId(color.palette)) {
      settings.color.palette = color.palette;
    }
    settings.color.match =
      oneOf(color.match, ["color", "brightness"] as const) ?? base.color.match;
    const extractCount = number(
      color.extractCount,
      MIN_PALETTE_COLORS,
      MAX_PALETTE_COLORS,
    );
    if (extractCount !== undefined) {
      settings.color.extractCount = Math.round(extractCount);
    }
  }

  const custom = colors(data.custom) ?? null;
  if (custom) settings.color.custom = custom;

  return { settings, custom, dithered: data.d === 1 };
}

/** Full link to the editor with these settings. */
export function settingsUrl(
  origin: string,
  settings: EditorSettings,
  dithered: boolean,
) {
  const url = new URL("/editor", origin);
  url.searchParams.set(SHARE_PARAM, encodeSettings(settings, dithered));
  return url.toString();
}
