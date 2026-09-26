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
//
//   node scripts/generate-previews.mjs
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

// --- Render -----------------------------------------------------------------

const server = await createServer({
  configFile: false,
  logLevel: "error",
  resolve: { alias: { "@": join(root, "src") } },
  server: { middlewareMode: true },
  appType: "custom",
});

try {
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

  // Animated sample: the grid rolls and the sun's stripes move once per loop. One 256-color
  // palette for every frame, nearest color only (dithering is the
  // editor's job).
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
  // Landing hero: every algorithm × palette pair at 240×160, and the
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
