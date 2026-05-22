# PixelSynth

Turn any image into algorithmic art using real dithering techniques — right in your browser. Upload a photo, pick from 15 dithering algorithms, tune the look, and export the result. No server uploads, no accounts.

🌐 **Live:** https://pixelsynth.art
💻 **Repo:** https://github.com/m4rcone/pixel-synth

## Features

- **15 dithering algorithms** — error diffusion (Floyd–Steinberg, Stucki, Atkinson…), ordered (Bayer, clustered dot, blue noise) and noise-based.
- **Interactive controls** — processing scale, brightness, contrast, noise and blur.
- **Tone mapping** — assign custom colors to shadows, midtones and highlights, with optional luminance preservation.
- **Live before / after** — pan, zoom and compare the original against the processed image.
- **100% client-side** — every pixel is computed locally; nothing leaves your device.
- **Responsive & accessible** — works on desktop and mobile, with keyboard support.

## Tech stack

- **Next.js** (App Router) · **React** · **TypeScript**
- **Tailwind CSS** · **shadcn/ui** (Radix UI)
- **Konva** (canvas viewport) · **Pixi.js** (image filters) · **Three.js** (animated background)
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
- `npm run test:a11y` — accessibility tests (Playwright)

## Status

A personal project by [m4rcone](https://github.com/m4rcone), focused on graphics experimentation, performance and modern front-end practices.
