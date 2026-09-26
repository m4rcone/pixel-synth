import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS, type EditorSettings } from "../settings";
import {
  decodeSettings,
  encodeSettings,
  SHARE_PARAM,
  settingsUrl,
} from "../share";

const encode = (data: unknown) =>
  btoa(JSON.stringify(data))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

const changed: EditorSettings = {
  ...DEFAULT_SETTINGS,
  algorithm: "atkinson",
  scale: 0.35,
  diffusion: 0.75,
  filters: {
    brightness: 1.2,
    contrast: -0.3,
    saturation: 1.4,
    blur: 1.5,
    noise: 0.1,
  },
  colorCount: 3,
  preserveLuminance: true,
  tones: {
    highlights: { color: "#ffeecc", range: 255 },
    midtones: { color: "#E53935", range: 150 },
    shadows: { color: "#112233", range: 60 },
  },
  color: {
    mode: "palette",
    palette: "custom",
    match: "brightness",
    extractCount: 12,
    custom: ["#000000", "#ff0000", "#ffffff"],
  },
};

describe("settings links", () => {
  it("round-trips every setting", () => {
    const shared = decodeSettings(encodeSettings(changed, true));
    expect(shared).toEqual({
      settings: changed,
      custom: changed.color.custom,
      dithered: true,
    });
  });

  it("keeps the defaults tiny and URL-safe", () => {
    const code = encodeSettings(DEFAULT_SETTINGS, false);
    expect(code.length).toBeLessThan(20);
    expect(encodeSettings(changed, true)).toMatch(/^[\w-]+$/);
    expect(decodeSettings(code)).toEqual({
      settings: DEFAULT_SETTINGS,
      custom: null,
      dithered: false,
    });
  });

  it("carries the custom palette only when it is selected", () => {
    const preset = {
      ...changed,
      color: { ...changed.color, palette: "gameboy" as const },
    };
    expect(decodeSettings(encodeSettings(preset, false))?.custom).toBeNull();
  });

  it("clamps out-of-range values and drops invalid ones", () => {
    const shared = decodeSettings(
      encode({
        v: 1,
        algorithm: "not-an-algorithm",
        scale: 50,
        filters: { contrast: -9, blur: "a lot", noise: 0.5 },
        colorCount: 7,
        tones: {
          midtones: { color: "red", range: 999 },
          highlights: { range: 10 },
        },
        color: { mode: "neon", palette: "nope", extractCount: 500 },
        custom: ["#fff"],
        d: "yes",
      }),
    )!;
    const { settings } = shared;
    expect(settings.algorithm).toBe(DEFAULT_SETTINGS.algorithm);
    expect(settings.scale).toBe(1);
    expect(settings.filters).toEqual({
      ...DEFAULT_SETTINGS.filters,
      contrast: -1,
      noise: 0.5,
    });
    expect(settings.colorCount).toBe(DEFAULT_SETTINGS.colorCount);
    expect(settings.tones.midtones).toEqual({
      color: DEFAULT_SETTINGS.tones.midtones.color,
      range: 255,
    });
    expect(settings.tones.highlights.range).toBe(255);
    expect(settings.color.mode).toBe("mono");
    expect(settings.color.palette).toBe(DEFAULT_SETTINGS.color.palette);
    expect(settings.color.extractCount).toBe(32);
    expect(shared.custom).toBeNull();
    expect(shared.dithered).toBe(false);
  });

  it("rejects codes it can't read", () => {
    expect(decodeSettings("%%%")).toBeNull();
    expect(decodeSettings(encode([1, 2]))).toBeNull();
    expect(decodeSettings(encode({ v: 2 }))).toBeNull();
  });

  it("builds an editor link with the code", () => {
    const url = new URL(settingsUrl("https://pixelsynth.art", changed, true));
    expect(url.pathname).toBe("/editor");
    expect(
      decodeSettings(url.searchParams.get(SHARE_PARAM)!)?.settings,
    ).toEqual(changed);
  });
});
