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
  group: PaletteGroup;
  match: PaletteMatch;
  colors: readonly string[];
};

export const PALETTE_PRESETS = [
  {
    id: "gameboy",
    name: "Game Boy",
    group: "Consoles & computers",
    match: "brightness",
    colors: ["#0f380f", "#306230", "#8bac0f", "#9bbc0f"],
  },
  {
    id: "pico8",
    name: "PICO-8",
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
    id: "cga-cyan-magenta",
    name: "CGA cyan/magenta",
    group: "Consoles & computers",
    match: "color",
    colors: ["#000000", "#55ffff", "#ff55ff", "#ffffff"],
  },
  {
    id: "cga-green-red",
    name: "CGA green/red",
    group: "Consoles & computers",
    match: "color",
    colors: ["#000000", "#55ff55", "#ff5555", "#ffff55"],
  },
  {
    id: "ega",
    name: "EGA",
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
    id: "grayscale-4",
    name: "Grayscale 4",
    group: "Print & photo",
    match: "brightness",
    colors: ["#000000", "#555555", "#aaaaaa", "#ffffff"],
  },
  {
    id: "newsprint",
    name: "Newsprint",
    group: "Print & photo",
    match: "brightness",
    colors: ["#1c1a17", "#efe6d2"],
  },
  {
    id: "sepia",
    name: "Sepia",
    group: "Print & photo",
    match: "brightness",
    colors: ["#2b1d14", "#6b4a2f", "#b08a5f", "#efe3cf"],
  },
  {
    id: "cyanotype",
    name: "Cyanotype",
    group: "Print & photo",
    match: "brightness",
    colors: ["#0e2a47", "#1f4e79", "#6f9fc8", "#e8eef2"],
  },
  {
    // Official Riso ink colors (Fluorescent Pink, Blue) plus black on paper.
    id: "riso",
    name: "Riso pink & blue",
    group: "Print & photo",
    match: "brightness",
    colors: ["#f2ede4", "#ff48b0", "#0078bf", "#000000"],
  },
  {
    id: "darkroom",
    name: "Darkroom",
    group: "PixelSynth",
    match: "brightness",
    colors: ["#120d0c", "#ee5140", "#ece4d6"],
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
export const MAX_PALETTE_COLORS = 32;
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
