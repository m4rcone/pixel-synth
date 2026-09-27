// Regenerates every derived image with the real pipeline, so the site always
// shows what the editor produces:
//   public/specimens/      the algorithm specimen (a CRT terminal on a table,
//                          scripts/specimen-scene.mjs) and every algorithm's
//                          preview of it
//   public/samples/        sample image (a synthwave sunset, scripts/sample-scene.mjs)
//                          and its animated version (GIF)
//   public/palettes/       palette previews of the sample, pixel art preset
//   public/landing/        hero variants (algorithm × palette), the dithered
//                          animated sample
//   src/data/sample-extracted-palette.json  colors of the "From image" preview
//   src/app/icon.svg, favicon.ico, apple-icon.png and public/icons/
//                          the app icons, from the mark in src/lib/brand.ts
//
//   node scripts/generate-previews.mjs           everything
//   node scripts/generate-previews.mjs --icons   the app icons only
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { deflateSync, crc32 } from "node:zlib";
import { createServer } from "vite";
import { makeSampleAnimation, makeSampleScene } from "./sample-scene.mjs";
import { makeSpecimen } from "./specimen-scene.mjs";

const root = process.cwd();

// --- Minimal PNG codec (8-bit RGBA, non-interlaced) -------------------------

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

/** An .ico holding PNG images (supported everywhere since Windows Vista). */
function encodeIco(pngs) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(pngs.length, 4);
  let offset = 6 + 16 * pngs.length;
  const entries = pngs.map(({ size, png }) => {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size % 256, 0);
    entry.writeUInt8(size % 256, 1);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(png.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += png.length;
    return entry;
  });
  return Buffer.concat([header, ...entries, ...pngs.map(({ png }) => png)]);
}

const hexRgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

/**
 * The mark on the screen color, square: `cell` px per Bayer cell, `margin`
 * px around the 4×4 grid. Whole pixels at every size, so it stays crisp.
 */
function renderMark(cells, colors, cell, margin) {
  const size = cell * 4 + margin * 2;
  const data = new Uint8ClampedArray(size * size * 4);
  const ink = hexRgb(colors.ink);
  const paper = hexRgb(colors.paper);
  const lit = new Set(cells.map(([x, y]) => `${x},${y}`));
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const gx = Math.floor((x - margin) / cell);
      const gy = Math.floor((y - margin) / cell);
      const on =
        x >= margin &&
        y >= margin &&
        gx < 4 &&
        gy < 4 &&
        lit.has(`${gx},${gy}`);
      data.set([...(on ? paper : ink), 255], (y * size + x) * 4);
    }
  }
  return { data, width: size, height: size };
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
  // App icons. Sizes keep the mark on whole pixels; the 512 px icon leaves
  // the margin maskable icons need.
  const { MARK_CELLS, BRAND_COLORS } =
    await server.ssrLoadModule("/src/lib/brand.ts");
  const mark = (cell, margin) =>
    encodePng(renderMark(MARK_CELLS, BRAND_COLORS, cell, margin));
  writeFileSync(
    join(root, "src/app/icon.svg"),
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" fill="${BRAND_COLORS.ink}"/><g fill="${BRAND_COLORS.paper}">${MARK_CELLS.map(([x, y]) => `<rect x="${4 + x * 6}" y="${4 + y * 6}" width="6" height="6"/>`).join("")}</g></svg>\n`,
  );
  writeFileSync(
    join(root, "src/app/favicon.ico"),
    encodeIco([
      { size: 16, png: mark(3, 2) },
      { size: 32, png: mark(6, 4) },
      { size: 48, png: mark(9, 6) },
    ]),
  );
  writeFileSync(join(root, "src/app/apple-icon.png"), mark(36, 18));
  mkdirSync(join(root, "public/icons"), { recursive: true });
  writeFileSync(join(root, "public/icons/icon-192.png"), mark(36, 24));
  writeFileSync(join(root, "public/icons/icon-512.png"), mark(96, 64));
  console.log(
    "icons → src/app/icon.svg, favicon.ico, apple-icon.png, public/icons/",
  );
  if (process.argv.includes("--icons")) process.exit(0);

  const { ALGORITHMS, PREVIEW_SOURCE, PREVIEW_SIZE } =
    await server.ssrLoadModule("/src/lib/algorithms.ts");
  const { renderPixels } = await server.ssrLoadModule(
    "/src/lib/editor/pipeline.ts",
  );
  const { DEFAULT_SETTINGS } = await server.ssrLoadModule(
    "/src/lib/editor/settings.ts",
  );

  // The specimen and every algorithm's 1-bit preview of it.
  rmSync(join(root, "public", "specimens"), { recursive: true, force: true });
  mkdirSync(join(root, "public", "specimens"), { recursive: true });
  const source = makeSpecimen(PREVIEW_SIZE);
  writeFileSync(
    join(root, "public", PREVIEW_SOURCE.slice(1)),
    encodePng(source),
  );
  console.log(`specimen → ${PREVIEW_SOURCE}`);

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

  // Animated sample: the grid rolls and the sun's stripes move once per
  // loop. One 256-color palette for every frame, nearest color only
  // (dithering is the editor's job).
  const { ANIMATED_SAMPLE } = await server.ssrLoadModule("/src/lib/samples.ts");
  const { renderAnimation } = await server.ssrLoadModule(
    "/src/lib/editor/pipeline.ts",
  );
  const { encodeAnimation } = await server.ssrLoadModule(
    "/src/lib/editor/animation.ts",
  );
  const animationFrames = makeSampleAnimation(
    ANIMATED_SAMPLE.width,
    ANIMATED_SAMPLE.height,
    ANIMATED_SAMPLE.frames,
  );
  const quantized = renderAnimation(
    animationFrames,
    {
      ...DEFAULT_SETTINGS,
      algorithm: "none",
      color: {
        ...DEFAULT_SETTINGS.color,
        mode: "palette",
        palette: "extracted",
        match: "color",
        extractCount: 256,
      },
    },
    { dither: true },
  );
  const animatedFile = join(root, "public", ANIMATED_SAMPLE.src.slice(1));
  writeFileSync(
    animatedFile,
    encodeAnimation(
      quantized.frames,
      animationFrames.map(() => ANIMATED_SAMPLE.delay),
      0,
    ),
  );
  console.log(`→ ${ANIMATED_SAMPLE.src}`);

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
  // Landing hero: every algorithm × palette pair at HERO_SIZE, and the
  // undithered original for the "before" side.
  const {
    HERO_ALGORITHMS,
    HERO_SIZE,
    HERO_PALETTES,
    HERO_ORIGINAL,
    ANIMATED_DITHER,
    heroVariant,
  } = await server.ssrLoadModule("/src/lib/samples.ts");
  rmSync(join(root, "public", "landing"), { recursive: true, force: true });
  write(
    HERO_ORIGINAL.src,
    makeSampleScene(HERO_ORIGINAL.width, HERO_ORIGINAL.height, { samples: 3 }),
  );
  for (const algorithm of HERO_ALGORITHMS) {
    for (const palette of HERO_PALETTES) {
      const preset = PALETTE_PRESETS.find((p) => p.id === palette);
      const settings = {
        ...DEFAULT_SETTINGS,
        algorithm,
        scale: HERO_SIZE.width / SAMPLE_IMAGE.width,
      };
      if (preset) {
        settings.color = {
          ...DEFAULT_SETTINGS.color,
          mode: "palette",
          palette: preset.id,
          match: preset.match,
        };
      }
      write(
        heroVariant(algorithm, palette),
        renderPixels(sample, settings, { dither: true }).pixels,
      );
    }
  }

  // The animated sample dithered at half size (one palette for every frame,
  // ordered dithering so the pattern holds still), and its first frame.
  const animatedPreset = PALETTE_PRESETS.find(
    (p) => p.id === ANIMATED_DITHER.palette,
  );
  const dithered = renderAnimation(
    animationFrames,
    {
      ...DEFAULT_SETTINGS,
      algorithm: ANIMATED_DITHER.algorithm,
      scale: ANIMATED_DITHER.width / ANIMATED_SAMPLE.width,
      color: {
        ...DEFAULT_SETTINGS.color,
        mode: "palette",
        palette: animatedPreset.id,
        match: animatedPreset.match,
      },
    },
    { dither: true },
  );
  writeFileSync(
    join(root, "public", ANIMATED_DITHER.src.slice(1)),
    encodeAnimation(
      dithered.frames,
      dithered.frames.map(() => ANIMATED_SAMPLE.delay),
      0,
    ),
  );
  console.log(`→ ${ANIMATED_DITHER.src}`);
  write(ANIMATED_DITHER.still, dithered.frames[0]);
} finally {
  await server.close();
}
