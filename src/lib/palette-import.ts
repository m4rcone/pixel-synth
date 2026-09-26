import { MAX_PALETTE_COLORS, MIN_PALETTE_COLORS } from "@/lib/palettes";

/**
 * Reads a palette from pasted text or a palette file, in the formats Lospec
 * offers for download:
 *
 * - GIMP `.gpl` ("GIMP Palette" header, decimal "R G B name" lines)
 * - JASC `.pal` ("JASC-PAL" header, decimal "R G B" lines)
 * - Paint.NET `.txt` (`;` comments, AARRGGBB hex)
 * - `.hex` (one RRGGBB per line), or any text with hex codes in it
 *   ("#1a1c2c, #5d275d…", CSS, a list copied from a web page).
 */

export type PaletteImport =
  | {
      ok: true;
      /** Lowercase "#rrggbb", duplicates removed, at most MAX_PALETTE_COLORS. */
      colors: string[];
      /** Palette name, when the file carries one (GIMP). */
      name: string | null;
      /** Distinct colors found, before the MAX_PALETTE_COLORS cut. */
      found: number;
    }
  | { ok: false; error: string };

/** File types the import accepts, for a file input's `accept`. */
export const PALETTE_FILE_TYPES = ".hex,.gpl,.pal,.txt,text/plain";

export function parsePalette(text: string): PaletteImport {
  const lines = text.replace(/^﻿/, "").split(/\r?\n/);
  const header = lines[0]?.trim().toUpperCase();
  let name: string | null = null;
  let found: string[];

  if (header === "GIMP PALETTE") {
    name =
      lines
        .find((line) => /^name:/i.test(line.trim()))
        ?.trim()
        .slice(5)
        .trim() || null;
    found = decimalColors(
      lines.slice(1).filter((l) => !l.trim().startsWith("#")),
    );
  } else if (header === "JASC-PAL") {
    // Header, version and count lines come before the colors.
    found = decimalColors(lines.slice(3));
  } else {
    found = hexColors(lines);
  }

  const colors = [...new Set(found)];
  if (colors.length < MIN_PALETTE_COLORS) {
    return {
      ok: false,
      error:
        colors.length === 0
          ? "No colors found. Paste hex codes, or open a HEX, GPL, PAL or Paint.NET TXT palette file."
          : `Only 1 color found. A palette needs at least ${MIN_PALETTE_COLORS}.`,
    };
  }
  return {
    ok: true,
    colors: colors.slice(0, MAX_PALETTE_COLORS),
    name,
    found: colors.length,
  };
}

/** "R G B" lines (0–255 each), with anything after the third number ignored. */
function decimalColors(lines: string[]) {
  const colors: string[] = [];
  for (const line of lines) {
    const match = /^\s*(\d{1,3})\s+(\d{1,3})\s+(\d{1,3})(?!\d)/.exec(line);
    if (!match) continue;
    const channels = match.slice(1, 4).map(Number);
    if (channels.some((c) => c > 255)) continue;
    colors.push(toHex(channels));
  }
  return colors;
}

/**
 * Hex codes anywhere in the text: RRGGBB, 8 digits (AARRGGBB bare as
 * Paint.NET writes them, RRGGBBAA after "#" as in CSS) and #RGB. Lines
 * starting with ";" are Paint.NET comments.
 */
function hexColors(lines: string[]) {
  const colors: string[] = [];
  const pattern =
    /(?<![0-9a-z])(#|0x)?([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})(?![0-9a-z])/gi;
  for (const line of lines) {
    if (line.trim().startsWith(";")) continue;
    for (const [, prefix, digits] of line.matchAll(pattern)) {
      let hex = digits.toLowerCase();
      if (hex.length === 3) {
        // Bare 3 letters are too often a word ("add", "bed").
        if (prefix !== "#") continue;
        hex = [...hex].map((c) => c + c).join("");
      } else if (hex.length === 8) {
        hex = prefix === "#" ? hex.slice(0, 6) : hex.slice(2);
      }
      colors.push(`#${hex}`);
    }
  }
  return colors;
}

function toHex(channels: number[]) {
  return `#${channels.map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}
