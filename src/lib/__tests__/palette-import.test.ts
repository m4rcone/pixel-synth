import { describe, expect, it } from "vitest";
import { parsePalette } from "@/lib/palette-import";
import { MAX_PALETTE_COLORS } from "@/lib/palettes";

const colors = (text: string) => {
  const result = parsePalette(text);
  return result.ok ? result.colors : result.error;
};

describe("parsePalette", () => {
  it("reads a Lospec .hex file", () => {
    expect(colors("1a1c2c\n5d275d\r\nb13e53\n")).toEqual([
      "#1a1c2c",
      "#5d275d",
      "#b13e53",
    ]);
  });

  it("reads a GIMP palette with its name", () => {
    const result = parsePalette(
      [
        "GIMP Palette",
        "Name: Sweetie 16",
        "Columns: 4",
        "#",
        "# a comment",
        " 26  28  44\t1a1c2c",
        "93 39 93 Untitled",
      ].join("\n"),
    );
    expect(result).toEqual({
      ok: true,
      colors: ["#1a1c2c", "#5d275d"],
      name: "Sweetie 16",
      found: 2,
    });
  });

  it("reads a JASC palette", () => {
    expect(colors("JASC-PAL\n0100\n2\n0 0 0\n255 128 7\n")).toEqual([
      "#000000",
      "#ff8007",
    ]);
  });

  it("reads Paint.NET AARRGGBB and skips its comments", () => {
    expect(
      colors(
        "; paint.net Palette File\n;Palette Name: Test\n;Colors: 2\nFF1a1c2c\nFF5d275d\n",
      ),
    ).toEqual(["#1a1c2c", "#5d275d"]);
  });

  it("finds hex codes in free text", () => {
    expect(
      colors("Colors: #1A1C2C, #5d275d; 0xb13e53 and #fff (#ef7d57cc)"),
    ).toEqual(["#1a1c2c", "#5d275d", "#b13e53", "#ffffff", "#ef7d57"]);
  });

  it("ignores words that look like short hex", () => {
    expect(colors("add bed #000000 cafe #ffffff")).toEqual([
      "#000000",
      "#ffffff",
    ]);
  });

  it("removes duplicates, keeping the first position", () => {
    expect(colors("#000000 #FFFFFF #000000 #ff0000")).toEqual([
      "#000000",
      "#ffffff",
      "#ff0000",
    ]);
  });

  it("keeps at most the palette limit and reports how many it found", () => {
    const hex = Array.from(
      { length: 100 },
      (_, i) => `#${i.toString(16).padStart(6, "0")}`,
    );
    const result = parsePalette(hex.join("\n"));
    expect(result.ok && result.colors).toEqual(
      hex.slice(0, MAX_PALETTE_COLORS),
    );
    expect(result.ok && result.found).toBe(100);
  });

  it("rejects text with fewer than two colors", () => {
    expect(parsePalette("https://lospec.com/palette-list/sweetie-16").ok).toBe(
      false,
    );
    expect(colors("#123456")).toMatch(/at least 2/);
  });

  it("skips out-of-range decimal channels", () => {
    expect(colors("JASC-PAL\n0100\n3\n0 0 0\n300 0 0\n9 9 9\n")).toEqual([
      "#000000",
      "#090909",
    ]);
  });
});
