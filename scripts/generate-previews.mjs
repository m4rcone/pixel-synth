// Regenerates every derived image with the real pipeline, so the site always
// shows what the editor produces:
//   public/250/            algorithm previews (sphere)
//   public/textures/       dithered headline texture
//   public/samples/        sample image (procedural sunset + calibration strip)
//   public/palettes/       palette previews of the sample, pixel art preset
//   src/data/sample-extracted-palette.json  colors of the "From image" preview
//
//   node scripts/generate-previews.mjs
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { deflateSync, inflateSync, crc32 } from "node:zlib";
import { createServer } from "vite";
import { makeSampleScene } from "./sample-scene.mjs";

const root = process.cwd();

// --- Minimal PNG codec (8-bit RGBA, non-interlaced) -------------------------

function decodePng(buffer) {
  let offset = 8;
  let width = 0;
  let height = 0;
  const idat = [];
  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString("ascii", offset + 4, offset + 8);
    const data = buffer.subarray(offset + 8, offset + 8 + length);
    if (type === "IHDR") {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      if (data[8] !== 8 || data[9] !== 6 || data[12] !== 0) {
        throw new Error("Only 8-bit RGBA non-interlaced PNGs are supported");
      }
    }
    if (type === "IDAT") idat.push(data);
    offset += 12 + length;
  }

  const raw = inflateSync(Buffer.concat(idat));
  const stride = width * 4;
  const out = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)];
    const line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    for (let x = 0; x < stride; x++) {
      const a = x >= 4 ? out[y * stride + x - 4] : 0;
      const b = y > 0 ? out[(y - 1) * stride + x] : 0;
      const c = x >= 4 && y > 0 ? out[(y - 1) * stride + x - 4] : 0;
      const p = a + b - c;
      const pa = Math.abs(p - a);
      const pb = Math.abs(p - b);
      const pc = Math.abs(p - c);
      const predictor = [
        0,
        a,
        b,
        (a + b) >> 1,
        pa <= pb && pa <= pc ? a : pb <= pc ? b : c,
      ][filter];
      out[y * stride + x] = (line[x] + predictor) & 255;
    }
  }
  return { data: out, width, height };
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body) >>> 0);
  return Buffer.concat([length, body, crc]);
}

function encodePng({ data, width, height }) {
  // Always RGBA; opaque images compress almost as well as RGB.
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header.set([8, 6, 0, 0, 0], 8);
  const raw = Buffer.alloc(height * (width * 4 + 1));
  for (let y = 0; y < height; y++) {
    raw.set(
      data.subarray(y * width * 4, (y + 1) * width * 4),
      y * (width * 4 + 1) + 1,
    );
  }
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// --- Render -----------------------------------------------------------------

const server = await createServer({
  configFile: false,
  logLevel: "error",
  resolve: { alias: { "@": join(root, "src") } },
  server: { middlewareMode: true },
  appType: "custom",
});

try {
  const { ALGORITHMS, PREVIEW_SOURCE } = await server.ssrLoadModule(
    "/src/lib/algorithms.ts",
  );
  const { renderPixels } = await server.ssrLoadModule(
    "/src/lib/editor/pipeline.ts",
  );
  const { DEFAULT_SETTINGS } = await server.ssrLoadModule(
    "/src/lib/editor/settings.ts",
  );

  const source = decodePng(
    readFileSync(join(root, "public", PREVIEW_SOURCE.slice(1))),
  );

  for (const algorithm of ALGORITHMS) {
    const { pixels: result } = renderPixels(
      source,
      { ...DEFAULT_SETTINGS, algorithm: algorithm.slug },
      { dither: true },
    );
    const file = join(root, "public", algorithm.preview.slice(1));
    writeFileSync(file, encodePng(result));
    console.log(`${algorithm.slug.padEnd(32)} → ${algorithm.preview}`);
  }

  // Headline texture: a vertical light-to-mid gradient, Floyd–Steinberg
  // dithered, "on" pixels in paper white and "off" pixels transparent so the
  // page shows through (used with background-clip: text).
  const width = 96;
  const height = 48;
  const gradient = {
    data: new Uint8ClampedArray(width * height * 4),
    width,
    height,
  };
  for (let y = 0; y < height; y++) {
    const v = 250 - (y / (height - 1)) * 130;
    for (let x = 0; x < width; x++) {
      gradient.data.set([v, v, v, 255], (y * width + x) * 4);
    }
  }
  const { pixels: texture } = renderPixels(
    gradient,
    {
      ...DEFAULT_SETTINGS,
      algorithm: "floyd-steinberg",
      tones: {
        ...DEFAULT_SETTINGS.tones,
        highlights: { color: "#ece4d6", range: 255 },
      },
    },
    { dither: true },
  );
  for (let i = 0; i < texture.data.length; i += 4) {
    if (texture.data[i] === 0) texture.data[i + 3] = 0;
  }
  mkdirSync(join(root, "public", "textures"), { recursive: true });
  writeFileSync(
    join(root, "public", "textures", "dithered-type.png"),
    encodePng(texture),
  );
  console.log("texture → /textures/dithered-type.png");

  // Sample image and palette previews.
  const {
    SAMPLE_IMAGE,
    PALETTE_PREVIEW_SIZE,
    PIXEL_ART_PREVIEW,
    PALETTE_PREVIEW_ALGORITHM,
    EXTRACTED_PREVIEW_COLORS,
    palettePreview,
  } = await server.ssrLoadModule("/src/lib/samples.ts");
  const { PALETTE_PRESETS } = await server.ssrLoadModule(
    "/src/lib/palettes.ts",
  );

  const sample = makeSampleScene(SAMPLE_IMAGE.width, SAMPLE_IMAGE.height);
  const write = (path, pixels) => {
    const file = join(root, "public", path.slice(1));
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, encodePng(pixels));
    console.log(`→ ${path}`);
  };
  write(SAMPLE_IMAGE.src, sample);

  const previewScale = PALETTE_PREVIEW_SIZE.width / SAMPLE_IMAGE.width;
  const renderPalette = (
    color,
    algorithm = PALETTE_PREVIEW_ALGORITHM,
    scale = previewScale,
  ) =>
    renderPixels(
      sample,
      {
        ...DEFAULT_SETTINGS,
        algorithm,
        scale,
        color: { ...DEFAULT_SETTINGS.color, mode: "palette", ...color },
      },
      { dither: true },
    );

  for (const preset of PALETTE_PRESETS) {
    write(
      palettePreview(preset.id),
      renderPalette({ palette: preset.id, match: preset.match }).pixels,
    );
  }

  const extracted = renderPalette({
    palette: "extracted",
    match: "color",
    extractCount: EXTRACTED_PREVIEW_COLORS,
  });
  write(palettePreview("extracted"), extracted.pixels);
  writeFileSync(
    join(root, "src/data/sample-extracted-palette.json"),
    JSON.stringify(extracted.palette, null, 2) + "\n",
  );

  const { PIXEL_ART_PRESET } = await server.ssrLoadModule(
    "/src/lib/editor/pixel-art.ts",
  );
  write(
    PIXEL_ART_PREVIEW.src,
    renderPalette(
      { palette: PIXEL_ART_PRESET.palette, match: PIXEL_ART_PRESET.match },
      PIXEL_ART_PRESET.algorithm,
      PIXEL_ART_PREVIEW.scale,
    ).pixels,
  );
} finally {
  await server.close();
}
