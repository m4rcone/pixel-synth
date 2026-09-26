/**
 * Color palettes for palette dithering.
 *
 * `match` is how image colors are mapped onto the palette:
 * - "color": each pixel takes the perceptually nearest palette color
 *   (multi-hue palettes: PICO-8, EGA…).
 * - "brightness": the palette is sorted dark → light and the image's
 *   luminance is dithered along that ramp (single-hue palettes: Game Boy,
 *   sepia…). Nearest-color matching fails there: a blue sky has no "close"
 *   green.
 */

export type PaletteMatch = "color" | "brightness";

export type PaletteGroup =
  | "Consoles & computers"
  | "Print & photo"
  | "PixelSynth"
  | "Dynamic";

export type PalettePreset = {
  id: string;
  name: string;
  description: string;
  group: PaletteGroup;
  match: PaletteMatch;
  colors: readonly string[];
};

export const PALETTE_PRESETS = [
  {
    id: "gameboy",
    name: "Game Boy",
    description:
      "The four greens of the original 1989 handheld’s screen. Matches by brightness, so any image stays readable.",
    group: "Consoles & computers",
    match: "brightness",
    colors: ["#0f380f", "#306230", "#8bac0f", "#9bbc0f"],
  },
  {
    // Wikipedia, "List of video game console palettes".
    id: "gameboy-pocket",
    name: "Game Boy Pocket",
    description:
      "The four near-grays of the 1996 Game Boy Pocket, which dropped the original’s green screen. Matches by brightness.",
    group: "Consoles & computers",
    match: "brightness",
    colors: ["#181818", "#4a5138", "#8c926b", "#c5caa4"],
  },
  {
    id: "pico8",
    name: "PICO-8",
    description:
      "The 16 colors of the PICO-8 fantasy console, a staple of indie pixel art.",
    group: "Consoles & computers",
    match: "color",
    colors: [
      "#000000",
      "#1d2b53",
      "#7e2553",
      "#008751",
      "#ab5236",
      "#5f574f",
      "#c2c3c7",
      "#fff1e8",
      "#ff004d",
      "#ffa300",
      "#ffec27",
      "#00e436",
      "#29adff",
      "#83769c",
      "#ff77a8",
      "#ffccaa",
    ],
  },
  {
    // The PPU builds colors as a composite TV signal, so there is no official
    // RGB set. These are the 54 distinct entries of the NTSC approximation in
    // Wikipedia's "List of video game console palettes", in PPU order.
    id: "nes",
    name: "NES",
    description:
      "The 54 colors of the Nintendo Entertainment System. The console made them as a TV signal, so there is no official RGB set: these follow a common NTSC approximation.",
    group: "Consoles & computers",
    match: "color",
    colors: [
      "#59595f",
      "#00008f",
      "#18008f",
      "#3f0077",
      "#550055",
      "#550011",
      "#550000",
      "#442200",
      "#333300",
      "#113300",
      "#003311",
      "#004444",
      "#004466",
      "#000000",
      "#080808",
      "#aaaaaa",
      "#0044dd",
      "#5511ee",
      "#7700ee",
      "#9900bb",
      "#aa0055",
      "#993300",
      "#884400",
      "#666600",
      "#336600",
      "#006600",
      "#006655",
      "#005588",
      "#eeeeee",
      "#4488ff",
      "#7777ff",
      "#9944ff",
      "#bb44ee",
      "#cc5599",
      "#dd6644",
      "#cc8800",
      "#bbaa00",
      "#77bb00",
      "#22bb22",
      "#22bb77",
      "#22bbcc",
      "#444444",
      "#99ccff",
      "#aaaaff",
      "#bb99ff",
      "#dd99ff",
      "#ee99dd",
      "#eeaaaa",
      "#eebb99",
      "#eedd88",
      "#bbdd88",
      "#99dd99",
      "#99ddbb",
      "#99ddee",
    ],
  },
  {
    id: "cga-cyan-magenta",
    name: "CGA cyan/magenta",
    description:
      "IBM PC CGA palette 1 at high intensity (1981): the look of early DOS games.",
    group: "Consoles & computers",
    match: "color",
    colors: ["#000000", "#55ffff", "#ff55ff", "#ffffff"],
  },
  {
    id: "cga-green-red",
    name: "CGA green/red",
    description:
      "CGA palette 0 at high intensity: green, red and yellow on black.",
    group: "Consoles & computers",
    match: "color",
    colors: ["#000000", "#55ff55", "#ff5555", "#ffff55"],
  },
  {
    id: "ega",
    name: "EGA",
    description: "The 16 default colors of the IBM EGA adapter (1984).",
    group: "Consoles & computers",
    match: "color",
    colors: [
      "#000000",
      "#0000aa",
      "#00aa00",
      "#00aaaa",
      "#aa0000",
      "#aa00aa",
      "#aa5500",
      "#aaaaaa",
      "#555555",
      "#5555ff",
      "#55ff55",
      "#55ffff",
      "#ff5555",
      "#ff55ff",
      "#ffff55",
      "#ffffff",
    ],
  },
  {
    id: "zx-spectrum",
    name: "ZX Spectrum",
    description:
      "The Sinclair ZX Spectrum’s 8 normal and 7 bright colors (black appears once).",
    group: "Consoles & computers",
    match: "color",
    colors: [
      "#000000",
      "#0000d7",
      "#d70000",
      "#d700d7",
      "#00d700",
      "#00d7d7",
      "#d7d700",
      "#d7d7d7",
      "#0000ff",
      "#ff0000",
      "#ff00ff",
      "#00ff00",
      "#00ffff",
      "#ffff00",
      "#ffffff",
    ],
  },
  {
    // "Pepto" calibration, the one most emulators use.
    id: "c64",
    name: "Commodore 64",
    description:
      "The Commodore 64’s 16 colors in the “Pepto” calibration most emulators use.",
    group: "Consoles & computers",
    match: "color",
    colors: [
      "#000000",
      "#ffffff",
      "#68372b",
      "#70a4b2",
      "#6f3d86",
      "#588d43",
      "#352879",
      "#b8c76f",
      "#6f4f25",
      "#433900",
      "#9a6759",
      "#444444",
      "#6c6c6c",
      "#9ad284",
      "#6c5eb5",
      "#959595",
    ],
  },
  {
    // TI TMS9918 datasheet YPbPr values converted to sRGB (SMPTE-C), as in
    // Wikipedia's "TMS9918" and "List of 8-bit computer hardware graphics".
    id: "msx",
    name: "MSX",
    description:
      "The 15 colors of the TI TMS9918 video chip in MSX computers (1983), converted from the chip’s datasheet.",
    group: "Consoles & computers",
    match: "color",
    colors: [
      "#000000",
      "#40b74a",
      "#75cf7e",
      "#5955de",
      "#4097ef",
      "#b85f51",
      "#66dbee",
      "#d9665a",
      "#fd8a7e",
      "#ccc360",
      "#ded088",
      "#3ba142",
      "#b667b4",
      "#cccccc",
      "#ffffff",
    ],
  },
  {
    // Hi-Res YIQ values converted to sRGB, as in Wikipedia's "List of 8-bit
    // computer hardware graphics".
    id: "apple-ii",
    name: "Apple II hi-res",
    description:
      "The six colors of the Apple II’s high-resolution mode (1977): black, white, green, purple, orange and blue.",
    group: "Consoles & computers",
    match: "color",
    colors: ["#000000", "#31d200", "#ce2dff", "#ff5600", "#00a9ff", "#ffffff"],
  },
  {
    id: "grayscale-4",
    name: "Grayscale 4",
    description: "Black, two grays and white: the next step after 1-bit.",
    group: "Print & photo",
    match: "brightness",
    colors: ["#000000", "#555555", "#aaaaaa", "#ffffff"],
  },
  {
    id: "newsprint",
    name: "Newsprint",
    description:
      "Ink on yellowed newsprint. Still 1-bit, without pure black or white.",
    group: "Print & photo",
    match: "brightness",
    colors: ["#1c1a17", "#efe6d2"],
  },
  {
    id: "sepia",
    name: "Sepia",
    description:
      "Four tones of darkroom sepia toning, from deep brown to paper.",
    group: "Print & photo",
    match: "brightness",
    colors: ["#2b1d14", "#6b4a2f", "#b08a5f", "#efe3cf"],
  },
  {
    id: "cyanotype",
    name: "Cyanotype",
    description:
      "Prussian blue on paper, from the photographic process of 1842.",
    group: "Print & photo",
    match: "brightness",
    colors: ["#0e2a47", "#1f4e79", "#6f9fc8", "#e8eef2"],
  },
  {
    // Official Riso ink colors (Fluorescent Pink, Blue) plus black on paper.
    id: "riso",
    name: "Riso pink & blue",
    description:
      "Official Riso Fluorescent Pink and Blue inks plus black, printed on paper.",
    group: "Print & photo",
    match: "brightness",
    colors: ["#f2ede4", "#ff48b0", "#0078bf", "#000000"],
  },
  {
    id: "pixelsynth",
    name: "PixelSynth",
    description:
      "PixelSynth’s own colors: screen black, three scan blues and the reticle yellow, which only lands on warm tones.",
    group: "PixelSynth",
    match: "color",
    // The deep blue fills the gap between black (L* 2) and the dim blue
    // (L* 63), so shadows and midtones don't dither from black alone.
    colors: ["#05080d", "#2a4260", "#7b9cbc", "#cfe6ff", "#ffd23f"],
  },
] as const satisfies readonly PalettePreset[];

/** Palettes computed per image or edited by the user. */
export const DYNAMIC_PALETTES = [
  { id: "extracted", name: "From image", group: "Dynamic" },
  { id: "custom", name: "Custom", group: "Dynamic" },
] as const;

export type PaletteId =
  | (typeof PALETTE_PRESETS)[number]["id"]
  | (typeof DYNAMIC_PALETTES)[number]["id"];

export const PALETTE_GROUPS: PaletteGroup[] = [
  "Consoles & computers",
  "Print & photo",
  "PixelSynth",
  "Dynamic",
];

export const MIN_PALETTE_COLORS = 2;
/** Large enough for every preset (NES: 54), so "Edit colors" never truncates. */
export const MAX_PALETTE_COLORS = 64;
export const DEFAULT_EXTRACT_COUNT = 8;
export const DEFAULT_CUSTOM_COLORS = [
  "#1d2b53",
  "#ff004d",
  "#ffec27",
  "#fff1e8",
];

const presets = new Map<string, PalettePreset>(
  PALETTE_PRESETS.map((p) => [p.id, p]),
);

export function getPalettePreset(id: string): PalettePreset | undefined {
  return presets.get(id);
}

/** Retired palette ids and their replacements, so old links keep working. */
const PALETTE_ALIASES: Record<string, PaletteId> = {
  // The old identity's palette, replaced with the new one's.
  darkroom: "pixelsynth",
};

/** The current id for `id`: itself, or what replaced a retired one. */
export function resolvePaletteId(id: string): string {
  return PALETTE_ALIASES[id] ?? id;
}

export function isPaletteId(id: string): id is PaletteId {
  return presets.has(id) || id === "extracted" || id === "custom";
}

export function paletteName(id: PaletteId) {
  return (
    presets.get(id)?.name ?? DYNAMIC_PALETTES.find((p) => p.id === id)!.name
  );
}

/** Default matching mode for a palette (dynamic ones match by color). */
export function defaultMatch(id: PaletteId): PaletteMatch {
  return presets.get(id)?.match ?? "color";
}
