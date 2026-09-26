import { crc32, inflateSync } from "node:zlib";
import { describe, expect, it } from "vitest";
import { createPixels, type Pixels } from "../pixels";
import { bitDepthFor, encodeIndexedPng, indexColors } from "../png";

type Chunk = { type: string; data: Buffer; crcOk: boolean };

function chunks(png: Buffer): Chunk[] {
  expect([...png.subarray(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
  const out: Chunk[] = [];
  for (let at = 8; at < png.length; ) {
    const length = png.readUInt32BE(at);
    const type = png.toString("ascii", at + 4, at + 8);
    const data = png.subarray(at + 8, at + 8 + length);
    const crc = png.readUInt32BE(at + 8 + length);
    out.push({
      type,
      data,
      crcOk: crc === crc32(png.subarray(at + 4, at + 8 + length)),
    });
    at += 12 + length;
  }
  return out;
}

/** Decodes an indexed, non-interlaced, filter-0 PNG back to RGBA. */
async function decode(blob: Blob) {
  const list = chunks(Buffer.from(await blob.arrayBuffer()));
  expect(list.every((c) => c.crcOk)).toBe(true);
  const header = list.find((c) => c.type === "IHDR")!.data;
  const width = header.readUInt32BE(0);
  const height = header.readUInt32BE(4);
  const depth = header[8];
  expect(header[9]).toBe(3);
  const plte = list.find((c) => c.type === "PLTE")!.data;
  const trns = list.find((c) => c.type === "tRNS")?.data;
  const raw = inflateSync(
    Buffer.concat(list.filter((c) => c.type === "IDAT").map((c) => c.data)),
  );
  const rowBytes = Math.ceil((width * depth) / 8);
  const rgba = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y++) {
    const row = raw.subarray(y * (rowBytes + 1), (y + 1) * (rowBytes + 1));
    expect(row[0]).toBe(0);
    for (let x = 0; x < width; x++) {
      const bit = x * depth;
      const index =
        (row[1 + (bit >> 3)] >> (8 - depth - (bit & 7))) & ((1 << depth) - 1);
      rgba.set(plte.subarray(index * 3, index * 3 + 3), (y * width + x) * 4);
      rgba[(y * width + x) * 4 + 3] =
        trns && index < trns.length ? trns[index] : 255;
    }
  }
  return { width, height, depth, rgba, hasTrns: !!trns };
}

function image(width: number, height: number, colors: number[][]): Pixels {
  const px = createPixels(width, height);
  for (let p = 0; p < width * height; p++) {
    px.data.set(colors[p % colors.length], p * 4);
  }
  return px;
}

describe("indexed PNG export", () => {
  it("picks the smallest bit depth for the palette", () => {
    expect([2, 3, 4, 5, 16, 17, 64, 256].map(bitDepthFor)).toEqual([
      1, 2, 2, 4, 4, 8, 8, 8,
    ]);
  });

  it("round-trips pixels exactly at every bit depth", async () => {
    for (const count of [2, 4, 16, 54]) {
      const colors = Array.from({ length: count }, (_, i) => [
        (i * 37) % 256,
        (i * 91) % 256,
        (i * 53) % 256,
        255,
      ]);
      // Odd width: rows end mid-byte at 1, 2 and 4 bits.
      const src = image(13, 7, colors);
      const out = await decode((await encodeIndexedPng(src))!);
      expect(out.depth).toBe(bitDepthFor(count));
      expect(out.rgba).toEqual(new Uint8Array(src.data));
      expect(out.hasTrns).toBe(false);
    }
  });

  it("enlarges nearest-neighbor by the factor", async () => {
    const src = image(3, 2, [
      [0, 0, 0, 255],
      [255, 255, 255, 255],
    ]);
    const out = await decode((await encodeIndexedPng(src, 4))!);
    expect([out.width, out.height]).toEqual([12, 8]);
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 12; x++) {
        const s = (Math.floor(y / 4) * 3 + Math.floor(x / 4)) * 4;
        expect(out.rgba.slice((y * 12 + x) * 4, (y * 12 + x) * 4 + 4)).toEqual(
          new Uint8Array(src.data.slice(s, s + 4)),
        );
      }
    }
  });

  it("keeps transparency, merging fully transparent pixels", async () => {
    const src = image(4, 1, [
      [10, 20, 30, 0],
      [200, 100, 50, 0],
      [255, 0, 0, 128],
      [0, 0, 255, 255],
    ]);
    expect(indexColors(src)!.palette.count).toBe(3);
    const out = await decode((await encodeIndexedPng(src))!);
    expect(out.hasTrns).toBe(true);
    expect([...out.rgba]).toEqual([
      0, 0, 0, 0, 0, 0, 0, 0, 255, 0, 0, 128, 0, 0, 255, 255,
    ]);
  });

  it("gives up past 256 colors", async () => {
    const colors = Array.from({ length: 257 }, (_, i) => [
      i % 256,
      i >> 8,
      0,
      255,
    ]);
    const src = image(257, 1, colors);
    expect(indexColors(src)).toBeNull();
    expect(await encodeIndexedPng(src)).toBeNull();
  });
});
