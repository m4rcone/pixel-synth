import type { Pixels } from "./pixels";

/**
 * Indexed PNG encoder for exports. Dithered images use few colors, so a
 * palette PNG at 1, 2, 4 or 8 bits per pixel is much smaller than the RGBA
 * PNG a canvas writes, with identical pixels. Enlargement happens on the
 * palette indices, row by row, streamed into the browser's own deflate
 * (CompressionStream): no huge canvas, low memory even at ×8.
 */

const MAX_COLORS = 256;
/** Batch compressed input in ~1 MB writes. */
const WRITE_CHUNK = 1 << 20;

type Palette = { rgba: Uint8Array; count: number };

/** Palette and per-pixel indices, or null past 256 distinct RGBA colors. */
export function indexColors(
  pixels: Pixels,
): { palette: Palette; indices: Uint8Array } | null {
  const { data, width, height } = pixels;
  const indices = new Uint8Array(width * height);
  const lookup = new Map<number, number>();
  const rgba = new Uint8Array(MAX_COLORS * 4);

  for (let p = 0, i = 0; p < indices.length; p++, i += 4) {
    // Fully transparent pixels are all the same color.
    const alpha = data[i + 3];
    const key =
      alpha === 0
        ? 0
        : ((data[i] << 24) |
            (data[i + 1] << 16) |
            (data[i + 2] << 8) |
            alpha) >>>
          0;
    let index = lookup.get(key);
    if (index === undefined) {
      if (lookup.size === MAX_COLORS) return null;
      index = lookup.size;
      lookup.set(key, index);
      rgba.set(alpha === 0 ? [0, 0, 0, 0] : data.subarray(i, i + 4), index * 4);
    }
    indices[p] = index;
  }
  return { palette: { rgba, count: lookup.size }, indices };
}

export function bitDepthFor(colors: number): 1 | 2 | 4 | 8 {
  return colors <= 2 ? 1 : colors <= 4 ? 2 : colors <= 16 ? 4 : 8;
}

/**
 * Encodes `pixels` enlarged `factor` times (nearest-neighbor) as an indexed
 * PNG. Returns null when the image has more than 256 colors.
 */
export async function encodeIndexedPng(
  pixels: Pixels,
  factor = 1,
): Promise<Blob | null> {
  const indexed = indexColors(pixels);
  if (!indexed) return null;
  const { palette, indices } = indexed;
  const width = pixels.width * factor;
  const height = pixels.height * factor;
  const depth = bitDepthFor(palette.count);
  const rowBytes = Math.ceil((width * depth) / 8);

  const deflate = new CompressionStream("deflate");
  const writer = deflate.writable.getWriter();
  // Read while writing, or the stream's backpressure would stall the writes.
  const compressed = new Response(deflate.readable).arrayBuffer();

  // One packed output row per source row, repeated `factor` times.
  const row = new Uint8Array(1 + rowBytes); // leading 0 = filter "None"
  const perByte = 8 / depth;
  let batch = new Uint8Array(Math.max(WRITE_CHUNK, row.length));
  let used = 0;
  for (let y = 0; y < pixels.height; y++) {
    row.fill(0);
    const source = y * pixels.width;
    for (let x = 0; x < width; x++) {
      const index = indices[source + Math.floor(x / factor)];
      const byte = 1 + Math.floor(x / perByte);
      const shift = 8 - depth * ((x % perByte) + 1);
      row[byte] |= index << shift;
    }
    for (let k = 0; k < factor; k++) {
      if (used + row.length > batch.length) {
        await writer.write(batch.subarray(0, used));
        batch = new Uint8Array(batch.length);
        used = 0;
      }
      batch.set(row, used);
      used += row.length;
    }
  }
  if (used) await writer.write(batch.subarray(0, used));
  await writer.close();
  const idat = new Uint8Array(await compressed);

  const header = new Uint8Array(13);
  const view = new DataView(header.buffer);
  view.setUint32(0, width);
  view.setUint32(4, height);
  header[8] = depth;
  header[9] = 3; // color type: indexed
  // Compression, filter and interlace methods stay 0.

  const plte = new Uint8Array(palette.count * 3);
  let lastTranslucent = -1;
  for (let c = 0; c < palette.count; c++) {
    plte.set(palette.rgba.subarray(c * 4, c * 4 + 3), c * 3);
    if (palette.rgba[c * 4 + 3] < 255) lastTranslucent = c;
  }
  const trns = new Uint8Array(lastTranslucent + 1);
  for (let c = 0; c < trns.length; c++) trns[c] = palette.rgba[c * 4 + 3];

  return new Blob(
    [
      new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]),
      ...chunk("IHDR", header),
      ...chunk("PLTE", plte),
      ...(trns.length ? chunk("tRNS", trns) : []),
      ...chunk("IDAT", idat),
      ...chunk("IEND", new Uint8Array(0)),
    ],
    { type: "image/png" },
  );
}

/** A PNG chunk as blob parts: length, type + data, CRC of type + data. */
function chunk(type: string, data: Uint8Array<ArrayBuffer>) {
  const length = new Uint8Array(4);
  new DataView(length.buffer).setUint32(0, data.length);
  const name = new Uint8Array([...type].map((c) => c.charCodeAt(0)));
  const crc = new Uint8Array(4);
  new DataView(crc.buffer).setUint32(0, crc32(data, crc32(name)) >>> 0);
  return [length, name, data, crc];
}

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

/** CRC-32 as PNG uses it; pass a previous result to continue it. */
function crc32(data: Uint8Array, previous?: number) {
  let c = previous === undefined ? 0xffffffff : ~previous;
  for (let i = 0; i < data.length; i++) {
    c = CRC_TABLE[(c ^ data[i]) & 0xff] ^ (c >>> 8);
  }
  return ~c;
}
