# PixelSynth

A free online dithering and pixel art tool. Turn any photo into dithered, 1-bit or pixel art images right in your browser: pick one of 17 dithering algorithms, dither to a classic palette like Game Boy, NES or PICO-8, separate it into CMYK inks, tune the look, share it as a link and export a crisp PNG or animated GIF. No uploads, no accounts, no watermark.

**Live:** https://pixelsynth.art

## Features

- **17 dithering algorithms**: error diffusion (Floyd–Steinberg, Stucki, Atkinson…), ordered (Bayer, clustered dot, void-and-cluster, blue noise), noise-based and halftone screens (round, square or diamond dots, or lines, at any size and angle; lines can be lifted by the light or waved). Each has its own page showing its kernel or threshold matrix, with a before/after comparison.
- **Color palettes**: dither straight to 17 classic palettes (Game Boy, Game Boy Pocket, PICO-8, NES, CGA, EGA, ZX Spectrum, C64, MSX, Apple II, sepia, cyanotype, riso…), a palette extracted from your image (2 to 64 colors) or your own custom colors. Match by color or by brightness.
- **Palette import**: paste a list of hex codes or open a palette file (Lospec's HEX, GPL, PAL or Paint.NET TXT) to fill the custom palette.
- **CMYK**: separate the image into cyan, magenta, yellow and black, dither each ink on its own and overprint them on white paper, like a four-color press. With the halftone and line screens, each ink takes its classic angle and the screens form rosettes; "Black ink" sets how much of the shared gray prints in black.
- **Palette gallery**: every palette previewed on the same sample image at `/palettes`, one click from the editor.
- **Pixel art preset**: one click shrinks any image to about 128 × 96 pixels' worth of detail, whatever its shape, and applies PICO-8 with a 2×2 Bayer pattern. Set the output width in pixels, or pick the nearest-color "None" option to skip dithering.
- **1-bit dot colors**: tint the dots of a classic 1-bit dither by brightness band (shadows, midtones, highlights), blended where bands meet, on a background of any color (dots darker than it print like ink) or a transparent one to lay the dither over other artwork.
- **Filters**: levels (black point, gamma, white point), contrast, brightness, saturation, sharpen, noise and blur; the image re-renders as soon as you release a control.
- **Error diffusion strength**: pass on less of each pixel's rounding error for flatter, cleaner areas with fewer stray dots (error diffusion algorithms).
- **Easy input**: drop, paste or pick a PNG, JPEG, WebP, GIF (animated too), AVIF or BMP file, or try the built-in samples (a ringed planet, and an animated version where the rings turn and the moon orbits).
- **Animated GIF**: load an animated GIF (up to 300 frames), play it or step through it frame by frame, dither every frame with one shared palette and save it as an animated GIF with the original timing. Large GIFs are scaled down to fit the memory budget.
- **Crisp export**: save a PNG (or an animated GIF) at ×1, ×2, ×4 or ×8, enlarged nearest-neighbor so every pixel stays a sharp block. Dithered images are saved as indexed PNGs (1 to 8 bits per pixel, transparency kept), several times smaller than a browser's RGBA PNG with identical pixels.
- **Share settings**: copy a link that reopens the editor with the same look, for any image. It carries the settings only, never your image.
- **Live before/after**: pan, zoom, pinch and compare the original with the result, with a split view or a toggle.
- **Fast**: the pipeline runs in a Web Worker; a 4-megapixel image dithers in roughly 0.1–0.35 s on a recent laptop.
- **100% client-side**: every pixel is computed on your device; nothing is uploaded. Analytics count page views only.
- **Responsive and accessible**: works on desktop and mobile, fully keyboard-operable, axe-tested on every route.

## Pages and links

| Route                | What it is                                                             |
| -------------------- | ---------------------------------------------------------------------- |
| `/`                  | Landing page: palettes, pixel art, use cases, how it works, FAQ        |
| `/editor`            | The editor                                                             |
| `/algorithms`        | The algorithm catalog, grouped by family (`#algorithm-<slug>` anchors) |
| `/algorithms/<slug>` | One page per algorithm                                                 |
| `/palettes`          | The palette gallery (`#palette-<id>` anchors)                          |

The editor accepts deep links, which can be combined:

- `/editor?algorithm=<slug>` preselects an algorithm (e.g. `?algorithm=atkinson`)
- `/editor?palette=<id>` switches to palette mode with that palette (e.g. `?palette=gameboy`)
- `/editor?preset=pixel-art` applies the pixel art preset to the next image you load
- `/editor?sample=1` opens the editor on the sample image; `?sample=animated` on the animated sample
- `/editor?s=<code>` reopens the editor with shared settings: the link icon in the control panel copies one for the current look (settings only, never the image)

Every page has its own metadata, Open Graph image and structured data; `/sitemap.xml` lists all of them.

## Feedback

- **Found a bug?** [Open a bug report](https://github.com/m4rcone/pixel-synth/issues/new?template=bug.yml). From the editor, "Report a bug" in the help menu fills in your settings and browser for you (never your image).
- **Have an idea?** [Suggest a feature](https://github.com/m4rcone/pixel-synth/discussions/new?category=ideas) in Discussions, or vote for an existing one.

## Tech stack

- **Next.js** (App Router, all routes statically prerendered) · **React** · **TypeScript**
- **Tailwind CSS** · **shadcn/ui** (Radix UI) · lucide icons
- A dependency-free image pipeline (typed arrays + Web Worker), Canvas 2D viewport and a single WebGL shader for the landing background
- **Vitest** (engine and pure logic) · **Playwright + axe** (end-to-end and accessibility)
- Deployed on **Vercel**

## Getting started

Requires **Node 20**.

```bash
git clone https://github.com/m4rcone/pixel-synth.git
cd pixel-synth
npm install
npm run dev
```

Then open http://localhost:3000.

### Scripts

- `npm run dev`: start the dev server
- `npm run build`: production build (also type-checks)
- `npm start`: run the production build
- `npm run lint:eslint`: lint, including accessibility rules (jsx-a11y)
- `npm run lint:prettier`: format everything with Prettier
- `npm test`: unit and end-to-end tests
- `npm run test:unit`: engine and logic tests (Vitest)
- `npm run test:e2e`: end-to-end and accessibility tests (Playwright; starts a dev server, or set `BASE_URL=http://localhost:3000` to reuse a running one)
- `npm run test:a11y`: only the accessibility tests
- `npm run perf:bundles`: per-route JavaScript size table (run after `npm run build`)
- `node scripts/generate-previews.mjs`: regenerate the sample image and every preview with the current engine
