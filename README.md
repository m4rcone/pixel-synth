# PixelSynth

Turn any image into algorithmic art using real dithering techniques — right in your browser. Upload a photo, pick from 15 dithering algorithms, tune the look, and export the result. No server uploads, no accounts.

**Live:** https://pixelsynth.art

## Features

- **15 dithering algorithms** — error diffusion (Floyd–Steinberg, Stucki, Atkinson…), ordered (Bayer, clustered dot, void-and-cluster blue noise) and noise-based. Each has its own page showing its kernel or threshold matrix.
- **Interactive controls** — processing scale, brightness, contrast, noise and blur.
- **Tone mapping** — assign custom colors to shadows, midtones and highlights, with optional luminance preservation.
- **Live before / after** — pan, zoom, pinch and compare the original against the processed image, side by side or with a toggle.
- **Fast** — the pipeline runs in a Web Worker; a 4-megapixel image dithers in roughly 0.1–0.35 s on a recent laptop.
- **100% client-side** — every pixel is computed locally; nothing leaves your device.
- **Responsive & accessible** — works on desktop and mobile, fully keyboard-operable, axe-tested.

## Tech stack

- **Next.js** (App Router, fully static) · **React** · **TypeScript**
- **Tailwind CSS** · **shadcn/ui** (Radix UI)
- A dependency-free image pipeline (typed arrays + Web Worker), Canvas 2D viewport and a single WebGL shader for the landing background
- **Vitest** (engine) · **Playwright + axe** (end-to-end and accessibility)
- Deployed on **Vercel**

## Getting started

Requires **Node 20+**.

```bash
git clone https://github.com/m4rcone/pixel-synth.git
cd pixel-synth
npm install
npm run dev
```

Then open http://localhost:3000.

### Scripts

- `npm run dev` — start the dev server
- `npm run build` — production build
- `npm start` — run the production build
- `npm test` — unit + end-to-end tests
- `npm run test:unit` — engine tests (Vitest)
- `npm run test:e2e` — end-to-end and accessibility tests (Playwright)
- `node scripts/generate-previews.mjs` — re-render the algorithm previews with the current engine
