# CLAUDE.md

Guidance for Claude Code when working in this repository.

## What this is

**PixelSynth** (https://pixelsynth.art) — a browser-only image dithering editor. Users upload an image, pick one of 17 dithering algorithms, tune filters and tone mapping, and export a PNG. Every pixel is processed on the client; nothing is uploaded.

## Stack

- Next.js (App Router, Turbopack), React 19, TypeScript (strict)
- Tailwind CSS 4 (tokens in `src/app/globals.css` `@theme`), shadcn/ui on Radix primitives, lucide icons
- Vitest for unit tests (engine), Playwright + axe for end-to-end accessibility tests
- Deployed on Vercel, all routes statically prerendered

## Commands

```bash
npm run dev            # dev server on :3000
npm run build          # production build (also type-checks)
npm run lint:eslint    # eslint (includes jsx-a11y)
npm run test:unit      # vitest: dithering engine and pure logic
npm run test:e2e       # all playwright tests: editor flows + axe (starts a dev server; PORT=xxxx reuses a running one)
npm run test:a11y      # only the accessibility spec
npm run perf:bundles   # per-route JS size table, run after `npm run build`
node scripts/generate-previews.mjs  # regenerate every derived image after engine or palette changes
```

Use the `/verify` command to run the whole gate before committing.

## Layout

- `src/app/` — routes. `/` is the landing page; `(studio)/` groups `/editor`, `/algorithms`, `/algorithms/[slug]` and `/palettes`, which share the studio sidebar and editor providers (state survives navigation between them). `/editor?algorithm=<slug>` and `?palette=<id>` preselect settings; `?preset=pixel-art` applies the pixel art preset to the next image loaded. `?sample=1` loads the sample image when the editor is empty (combines with the others); `?sample=animated` loads the animated sample GIF. `?s=<code>` applies shared settings (`src/lib/editor/share.ts`: versioned base64url JSON of what differs from the defaults, validated and clamped on read; bump its version on breaking changes to the settings shape). The preset lives in `src/lib/editor/pixel-art.ts` (fixed pixel count, not fixed width) and is applied only through `usePixelArtPreset()`. Each route has an `opengraph-image.tsx` built on `src/lib/og-image.tsx`; use `pageMetadata()` from `src/lib/site.ts` for page metadata.
- `src/lib/algorithms.ts` — single source of truth for the algorithm catalog (slug = id = public anchor). Never hardcode algorithm lists elsewhere; never change an existing slug.
- `src/lib/samples.ts` — paths of generated assets: the sample image (a procedural synthwave sunset, lit in HDR with bloom, from `scripts/sample-scene.mjs`), the animated sample GIF, palette previews, pixel art preview, the landing hero variants (`heroVariant()`: every `HERO_ALGORITHMS` × `HERO_PALETTES` pair at `heroSize()`, 240×160 or 480×320 for halftone screens, plus the undithered original) and the dithered animated sample. The algorithm specimen (a CRT terminal on a table, `scripts/specimen-scene.mjs`) and its 1-bit previews live in `src/lib/algorithms.ts` (`PREVIEW_SOURCE`, `PREVIEW_SIZE`, 400 px so halftone screens still read). Never edit those files by hand; rerun `node scripts/generate-previews.mjs` (unit tests check they exist).
- `src/lib/editor/` — the image pipeline: pure functions over RGBA buffers (`pipeline.ts`: downscale → filters → mono dither + tone map, `palette-dither.ts`, or `cmyk.ts`: each process ink dithered separately, screens at the classic angles, overprinted on white). It runs in a Web Worker (`render.worker.ts`, `render-client.ts`). Results stay at the native processing resolution; the viewport and the export enlarge them nearest-neighbor. `settings.ts` holds the settings type and defaults. Keep it DOM-free so it stays testable and worker-safe.
- `src/lib/palettes.ts` — preset palettes (hex values from each system's reference) with their default match mode ("color" or "brightness"). `src/lib/palette-import.ts` parses pasted text or palette files (Lospec's HEX, GPL, PAL, Paint.NET TXT) into the custom palette.
- `src/lib/editor/gif/` — in-house GIF codec (`decode.ts` coalesces frames, `encode.ts`, `lzw.ts`); `errors.ts` stays codec-free so the main bundle can import it. `animation.ts` decodes to equally sized frames and exports GIFs; it runs in the worker. The limits (frames, pixel budget) live in `animation-limits.ts` so pages can quote them without loading the codec. An animated GIF becomes `SourceImage.animation` (frames, bitmaps, delays, loop; `pixels`/`bitmap` stay frame 1). Every frame shares one palette (`resolveAnimationPalette`); the worker renders the shown frame first, reports progress and drops a render once a newer one arrives. The provider keeps `resultFrames` next to `result`; `frameResult()` gives the processed image for a frame. Frame and play state live in `canvas-context`; playback in `use-animation-playback.ts`.
- `src/contexts/editor-context.tsx` — reducer-based editor state. Components call `update()` while a control is being dragged and `commit()` when a value settles; the provider renders once per commit and drops stale results.
- `src/contexts/canvas-context.tsx` — view state (zoom, pan, before/after).
- `src/components/editor/` — editor UI. The control panel is mounted once and laid out by CSS (no JS breakpoint switching, no duplicate IDs).
- `src/components/landing/` — the landing's client islands: the before/after hero instrument (on `compare-slider.tsx`) and the animated GIF demo with its pause control. The rest of `/` is a server component.
- `src/components/ui/` — shadcn primitives. `src/components/` — shared app components.

## Conventions

- **Design tokens only.** Use the Tailwind theme tokens (`bg-ink`, `text-paper-dim`, `text-safelight`, `text-label`, `text-caps`, …) instead of arbitrary values like `text-[10px]` or `text-[var(--x)]`. Add a token before adding a one-off value. The token names (`ink`, `paper`, `safelight`) predate the current identity and are due for a rename; their values are the console's.
- **Dark only.** The identity ("Enhance") is an 80s image-analysis console: near-black blue screen (`ink`), blue-white scan text (`paper`), square corners, and a single yellow reticle accent (`safelight`) reserved for focus, the cursor over an image and active or processing states, never decoration and never the only cue. Hover goes to white (`paper-hot`); error text uses `danger`. There is no light theme.
- **Type.** Sixtyfour (`font-display`, SCAN axis) only for titles from 28px up and numbers from 22px up, always with `text-glow`; everything else is Azeret Mono. Control labels are sentence case (`text-label`); section heads, card meta and column titles are tracked caps (`text-caps`). Primary buttons have a cut corner, secondary buttons corner brackets.
- **Effects stay in the chrome.** `scanlines` is a static background layer for chrome surfaces (panels, headers, the landing); glow only on Sixtyfour. Neither ever goes over the user's image: images sit on the neutral `ink-sunken` well (#0B0B0B), enlarged nearest-neighbor. Contrast is measured without the glow.
- **Keep it light.** Ask before adding runtime dependencies. Prefer platform APIs (Canvas 2D, WebGL, Workers) over graphics libraries.
- **Accessibility is a gate.** Every route must pass axe; interactive canvases need keyboard equivalents; respect `prefers-reduced-motion`; auto-advancing or moving content needs a pause control.
- **Preserve URLs.** `/`, `/editor`, `/algorithms` and the `#algorithm-<slug>` anchors are public; do not break them.
- Prettier with the Tailwind plugin formats everything (`npm run lint:prettier`).
- Commits: conventional style (`feat:`, `fix:`, `refactor:`, `perf:`, `chore:`).
