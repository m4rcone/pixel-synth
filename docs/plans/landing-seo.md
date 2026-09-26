# Plan: landing page update and SEO

Approved by the owner on 2026-09-25. Implement in the phases below, **one commit per numbered step**, running the checks in "Verification" before each commit. Visual proposal (with mockups): https://claude.ai/artifact/9XvpCDonrrBD5ioUyczcY6

## Decisions (final)

| #   | Decision                                                                                                         |
| --- | ---------------------------------------------------------------------------------------------------------------- | --------------- |
| 1   | The whole landing structure below is approved (hero, palettes, pixel art, use cases, how it works, FAQ, footer). |
| 2   | Home `<title>`: \*\*`Free Online Dithering & Pixel Art Tool                                                      | PixelSynth`\*\* |
| 3   | Build the per-palette pages (phase 2) and the dithering guide (phase 3).                                         |
| 4   | Search Console property: **https://pixelsynth.art/** (the owner verifies it; see phase 3).                       |
| 5   | Portuguese (pt-BR) version: **later**, not in this plan.                                                         |

## Ground rules for the implementing session

- Read `CLAUDE.md` first; follow its conventions (tokens only, dark only, sentence case, `text-label`/`text-readout`, no new runtime deps without asking).
- **Stage files by explicit path**, never `git add -A`: `test-image.png` at the repo root is the owner's untracked file and must not be committed.
- The owner usually runs `npm run dev` on `localhost:3000`. Don't kill it. Run e2e against it with `BASE_URL=http://localhost:3000 npm run test:e2e`. Visit via `localhost`, not `127.0.0.1` (dev resources are blocked cross-origin).
- Never hardcode counts: use `ALGORITHMS.length` (15) and `PALETTE_PRESETS.length` (13).
- Site copy is English. Copy below is final unless it contradicts the code; if a statement can't be verified in the code, flag it instead of shipping it.
- Commit messages: conventional style, ending with the Co-Authored-By line used in the history.

## Current state (for orientation)

- Landing: `src/app/page.tsx` (hero with dithered H1 `Smooth in. / Dither out.`, `DitherSpecimen` comparator, 3 feature cards, CTA, footer).
- Site metadata: `src/lib/site.ts` (`siteConfig.title` / `description`, `pageMetadata()`, `breadcrumbStructuredData()`); root metadata in `src/app/layout.tsx`.
- OG images: `src/lib/og-image.tsx` (`renderOgImage`, supports `imageSize`), one `opengraph-image.tsx` per route.
- Palettes: data in `src/lib/palettes.ts` (each preset has `description`, `colors`, `match`); gallery at `src/app/(studio)/palettes/page.tsx` with anchors `#palette-<id>` (keep them working).
- Generated images (never edit by hand; regenerate with `node scripts/generate-previews.mjs`): `public/palettes/<id>.png` (480×320), `public/palettes/pixel-art.png`, `public/samples/sunset.png`. Paths in `src/lib/samples.ts`.
- Editor deep links (`src/components/editor/settings-from-url.tsx`): `?algorithm=`, `?palette=`, `?preset=pixel-art`.
- The "Try a sample image" logic lives inside `src/components/editor/image-dropzone.tsx` (`openSample`).
- Analytics: `@vercel/analytics` page views only (no image data) — this backs the FAQ privacy answer.

---

## Phase 1 — Landing

### 1.1 Metadata

- `siteConfig.title` → `Free Online Dithering & Pixel Art Tool | PixelSynth`. Because the root layout uses it as `title.default` (no template applied), it must be the full string. Check OG/Twitter titles in `layout.tsx` still read well.
- `siteConfig.description` → `Turn photos into dithered, 1-bit or pixel art images in your browser. 15 algorithms, Game Boy, PICO-8 and CGA palettes. Free, no uploads.` (build it from the counts; keep ≤ 160 chars).
- Keep `siteConfig.description` used by JSON-LD and OG as is (same string).

### 1.2 `?sample=1`

- Extract the sample loading from `image-dropzone.tsx` into a hook (e.g. `src/hooks/use-load-sample.ts`) returning `{ loadSample, loading }`; the dropzone uses it.
- `SettingsFromUrl` handles `?sample=1`: if no image is loaded, load the sample once on mount. It must combine with the other params (e.g. `/editor?sample=1&preset=pixel-art` loads the sample, then the pending preset applies).
- E2E: `/editor?sample=1` shows the canvas with output width 1800.

### 1.3 Landing sections

Order and content (keep the design system; the dithered H1 stays the page's one bold element):

1. **Hero** (changed)
   - H1 gains a first line, visible and part of the `<h1>`: `Online image dithering & pixel art converter` (small, `text-safelight`, sans, sentence case) above `Smooth in.` / `Dither out.`.
   - Lead: `Turn any photo into dithered, 1-bit or pixel art images. 15 algorithms, Game Boy, PICO-8 and CGA palettes, crisp exports. Everything runs on your device.`
   - Buttons: `Open the editor` (primary, `/editor`) and `Try it with a sample` (outline, `/editor?sample=1`).
   - Facts `<dl>`: `15 Algorithms`, `13 Palettes`, `0 Uploads` (replaces `Families` / `Local`).
2. **Before/after comparator** (kept): `DitherSpecimen` as is.
3. **Palettes** (new) — heading `Classic palettes, one click away`; text `Dither straight to the colors of the Game Boy, PICO-8, CGA or a risograph, or to colors taken from your own image.` Six thumbnails from `palettePreview(id)`: gameboy, pico8, cga-cyan-magenta, sepia, riso, cyanotype. Each links to `/palettes#palette-<id>` in phase 1 (switch to `/palettes/<id>` in phase 2). Link `See all 13 palettes` → `/palettes`. Thumbnails are downscaled: no `pixelated` below their natural size.
4. **Pixel art** (new) — `PIXEL_ART_PREVIEW` image (pixelated, enlarged); heading `Photo to pixel art in one click`; text `The pixel art preset shrinks any image to about 128 × 96 pixels, snaps it to PICO-8 with a 2×2 Bayer pattern and exports crisp at ×4 or ×8.`; button `Try the pixel art preset` → `/editor?sample=1&preset=pixel-art`.
5. **Use cases** (new; replaces the three `FEATURES` cards — reuse their facts, drop the cards) — 2×2 grid, each with a small preview and internal links:
   - `Pixel art & game assets` — `Shrink a photo to sprite size, snap it to PICO-8 or Game Boy and export at ×1 for your engine.` → PICO-8 palette, pixel art preset.
   - `Print, zines & risograph` — `Split tones into ink-friendly dots with newsprint, sepia, cyanotype and riso palettes.` → riso palette, `/algorithms/clustered-dot-halftone-ordered`.
   - `Laser engraving & plotters` — `Engravers burn dots, not grays. Floyd–Steinberg, Atkinson or Jarvis give pure black-and-white PNGs.` → `/algorithms/atkinson`, `/algorithms/floyd-steinberg`.
   - `Posters, covers & social` — `A printed, retro texture for album art, posters and posts, sized for sharing.` → `/editor?sample=1`.
6. **How it works** (new; a real sequence, so numbered): `Load an image` — `Drop, paste or pick a file. It never leaves your device.` / `Choose the look` — `An algorithm, 1-bit or a palette, filters and size.` / `Export` — `Crisp PNG at ×1 to ×8, no watermark.`
7. **FAQ** (new) — `<details>`/`<summary>` (keyboard accessible, no JS):
   - `What is dithering?` — `A way to show more tones than a palette has by arranging its colors in patterns of dots, so the eye blends them.`
   - `Is PixelSynth free?` — `Yes. No account, no watermark, no limits.`
   - `Are my images uploaded?` — `No. Every pixel is processed in your browser. The anonymous page-view counter never sees your images.`
   - `Which algorithm should I use?` — `Floyd–Steinberg for detail, Atkinson for crisp retro highlights, Bayer for a regular pattern, Blue Noise for a smooth grain.` (link algorithm names)
   - `How do I make Game Boy style images?` — `Choose the Game Boy palette, or apply the pixel art preset and switch its palette to Game Boy.`
   - `Which formats are supported?` — `PNG, JPEG, WebP, GIF, AVIF and BMP in; PNG out, enlarged ×1 to ×8.` (derive from `SUPPORTED_FORMATS_LABEL`)
8. **Final CTA** (changed): keep `Drop in an image. Pick an algorithm. Watch it develop.`, add `Try it with a sample` next to `Start dithering`.
9. **Footer site map** (changed) — a shared `SiteFooter` component, four columns:
   - Editor: Open the editor · Pixel art preset (`/editor?sample=1&preset=pixel-art`) · Try a sample (`/editor?sample=1`)
   - Algorithms: Floyd–Steinberg · Atkinson · Bayer 8×8 · All 15
   - Palettes: Game Boy · PICO-8 · CGA cyan/magenta · All 13
   - About: What is dithering? (add in phase 3) · Source on GitHub (`siteConfig.links.repository`)
   - Keep `© 2026 PixelSynth — a dithering image editor` and `Runs entirely in your browser.`
   - Use it on the landing and at the bottom of `/algorithms`, `/algorithms/[slug]` and `/palettes` (inside the scroll container). Not in the editor.

### 1.4 Structured data

- Home `WebApplication`: add `featureList` (short strings: dithering algorithms, palettes, pixel art preset, local processing, PNG export ×1–×8) and `screenshot` (absolute URL of a representative image, e.g. `palettePreview("pico8")`).
- Add `FAQPage` JSON-LD with exactly the visible FAQ questions/answers (plain text). Don't promise rich results: Google shows FAQ snippets only for a few sites.

### 1.5 Home OG image

- `src/app/opengraph-image.tsx`: subtitle along the lines of `Dither images · Pixel art · 13 palettes`, image = a palette preview (use `imageSize: PALETTE_PREVIEW_SIZE`), keep eyebrow/title style of `renderOgImage`.

### 1.6 Tests (phase 1)

- E2E: `?sample=1`; `?sample=1&preset=pixel-art` ends dithered with output width 136 and PICO-8; landing links resolve (palette thumbnails, use cases, footer).
- axe on `/` (desktop + phone) already runs; FAQ `<details>` must pass.
- Unit (optional): home JSON-LD FAQ matches the visible FAQ source (share one array).

---

## Phase 2 — Per-palette pages

### 2.1 `/palettes/[id]`

- Route `src/app/(studio)/palettes/[id]/page.tsx`, `generateStaticParams` from `PALETTE_PRESETS`, `dynamicParams = false`. `extracted` and `custom` stay on the gallery only.
- Content: breadcrumb `Home › Palettes › <name>` (`GlobalHeader` `parent`), H1 `<name> palette`, the preview (480×320, pixelated at ≥ natural size), description, **color list with hex values and a copy button per color** (client component; `navigator.clipboard.writeText` inside the click handler, fall back to selecting text), match mode explained, `Use in the editor` (`/editor?palette=<id>`) and `Try it with a sample` (`/editor?sample=1&palette=<id>`), previous/next palette.
- An "About" paragraph per palette. Facts to use (verify each before shipping; drop any you can't confirm):
  - Game Boy — Nintendo, 1989; the original model's screen shows four shades of green.
  - PICO-8 — fantasy console by Lexaloffle; fixed 16-color palette.
  - CGA — IBM Color Graphics Adapter, 1981; 320×200 mode with fixed four-color palettes.
  - EGA — IBM Enhanced Graphics Adapter, 1984; 16 default colors.
  - ZX Spectrum — Sinclair, 1982; 8 colors with a bright variant each (black identical).
  - Commodore 64 — 1982; 16 fixed colors; values follow the widely used "Pepto" measurement.
  - Cyanotype — photographic printing process introduced by John Herschel in 1842.
  - Risograph — stencil duplicator by Riso Kagaku (Japan); inks named as in Riso's color list.
  - Grayscale 4, Newsprint, Sepia, Darkroom — describe the look; no history needed.
- Metadata via `pageMetadata`: title `<name> Palette Dithering`, description `Dither any image to the <n>-color <name> palette online. See the colors with hex codes and try it free in your browser.` (adapt per palette). OG image per page (`opengraph-image.tsx` with `generateStaticParams`, the palette preview). JSON-LD: breadcrumb + `CreativeWork`/`DefinedTermSet`-free simple `WebPage` with `about`.
- Gallery cards and landing thumbnails link to `/palettes/<id>`; keep the `#palette-<id>` anchors on the gallery.
- Sitemap: add the 13 URLs with their preview images.

### 2.2 Titles and descriptions of the other pages

- `/editor` → `Online Dithering Editor — Free, No Uploads` (becomes `… | PixelSynth`).
- `/palettes` → `Color Palettes for Dithering: Game Boy, PICO-8, CGA`.
- `/algorithms` → `Dithering Algorithms Compared: Floyd–Steinberg, Bayer, Atkinson`.
- `/algorithms/[slug]` → keep `<name> dithering`; make descriptions action-first (`Dither images with <name> online…`).
- Check lengths (title ≲ 60, description ≲ 160) with a unit test over the metadata helpers if cheap.

### 2.3 Tests (phase 2)

- Unit: every palette page has a preview and a non-empty description; titles within limits.
- E2E: copy button puts the hex on the clipboard (grant clipboard permissions in the test context) or at least shows feedback; palette page → editor link applies the palette.
- axe on one palette page (desktop + phone).

---

## Phase 3 — Guide and measurement

### 3.1 `/learn/dithering`

- Static page (outside `(studio)`, like the landing, with the landing header and `SiteFooter`), ~1,000–1,500 words, plain explanations with engine-rendered images:
  1. What dithering is (tones vs palette; a gradient with 2 colors, before/after).
  2. Error diffusion (how the error moves; link the 8 algorithm pages; kernel diagram reuse from `AlgorithmMethod`).
  3. Ordered dithering (threshold matrices, Bayer, clustered dot, blue noise; link pages).
  4. Noise-based.
  5. Choosing an algorithm (table: goal → algorithm).
  6. Palettes and pixel art (link `/palettes`, preset).
  7. Dithering for print and laser engraving (practical tips, no claims about specific machines).
- Metadata: `What Is Dithering? A Visual Guide to Dithering Algorithms`; `Article` JSON-LD; OG image; sitemap; footer link "What is dithering?"; landing FAQ answer links to it.
- Any new images: add them to `scripts/generate-previews.mjs`, never hand-made.

### 3.2 Search Console (owner action)

- Property: `https://pixelsynth.art/`. Preferred: **Domain property via DNS TXT record** (no code change; the owner adds it at the DNS provider).
- If the owner prefers the HTML tag method, they provide the token and the code adds `verification: { google: "<token>" }` to the root `metadata` in `src/app/layout.tsx`.
- After verification: submit `https://pixelsynth.art/sitemap.xml`. Revisit titles/descriptions after 4–8 weeks of query data.

---

## Verification (before every commit)

```bash
npm run lint:eslint
npx tsc --noEmit            # if it fails on .next/types after adding a route, run `npm run build` once
npm run test:unit
npm run build && npm run perf:bundles   # home should stay around 40 KB gzip JS
BASE_URL=http://localhost:3000 npm run test:e2e
```

Also look at the changed pages at 1440 px and 390 px (Playwright screenshots are fine) before committing.

## Out of scope

- pt-BR version (decided: later).
- Blog, accounts, analytics events beyond Vercel page views.
- New runtime dependencies.
