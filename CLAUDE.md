# CLAUDE.md

Guidance for Claude Code when working in this repository.

## What this is

**PixelSynth** (https://pixelsynth.art) — a browser-only image dithering editor. Users upload an image, pick one of 15 dithering algorithms, tune filters and tone mapping, and export a PNG. Every pixel is processed on the client; nothing is uploaded.

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
node scripts/generate-previews.mjs  # re-render public/250 previews after engine changes
```

Use the `/verify` command to run the whole gate before committing.

## Layout

- `src/app/` — routes. `/` is the landing page; `(studio)/` groups `/editor`, `/algorithms` and `/algorithms/[slug]`, which share the studio sidebar and editor providers (state survives navigation between them). `/editor?algorithm=<slug>` preselects an algorithm. Each route has an `opengraph-image.tsx` built on `src/lib/og-image.tsx`; use `pageMetadata()` from `src/lib/site.ts` for page metadata.
- `src/lib/algorithms.ts` — single source of truth for the algorithm catalog (slug = id = public anchor). Never hardcode algorithm lists elsewhere; never change an existing slug.
- `src/lib/editor/` — the image pipeline: pure functions over RGBA buffers (`pipeline.ts`: downscale → filters → luminance → dither → tone map → upscale), run in a Web Worker (`render.worker.ts`, `render-client.ts`). `settings.ts` holds the settings type and defaults. Keep it DOM-free so it stays testable and worker-safe.
- `src/contexts/editor-context.tsx` — reducer-based editor state. Components call `update()` while a control is being dragged and `commit()` when a value settles; the provider renders once per commit and drops stale results.
- `src/contexts/canvas-context.tsx` — view state (zoom, pan, before/after).
- `src/components/editor/` — editor UI. The control panel is mounted once and laid out by CSS (no JS breakpoint switching, no duplicate IDs).
- `src/components/ui/` — shadcn primitives. `src/components/` — shared app components.

## Conventions

- **Design tokens only.** Use the Tailwind theme tokens (`bg-ink`, `text-paper-dim`, `text-safelight`, `text-label`, …) instead of arbitrary values like `text-[10px]` or `text-[var(--x)]`. Add a token before adding a one-off value.
- **Dark only.** The identity is a photographic darkroom: ink black, paper off-white, a single red safelight accent, mono uppercase technical labels, serif display type. There is no light theme.
- **Keep it light.** Ask before adding runtime dependencies. Prefer platform APIs (Canvas 2D, WebGL, Workers) over graphics libraries.
- **Accessibility is a gate.** Every route must pass axe; interactive canvases need keyboard equivalents; respect `prefers-reduced-motion`; auto-advancing or moving content needs a pause control.
- **Preserve URLs.** `/`, `/editor`, `/algorithms` and the `#algorithm-<slug>` anchors are public; do not break them.
- Prettier with the Tailwind plugin formats everything (`npm run lint:prettier`).
- Commits: conventional style (`feat:`, `fix:`, `refactor:`, `perf:`, `chore:`).
