# CLAUDE.md

Guidance for Claude Code when working in this repository.

## What this is

**PixelSynth** (https://pixelsynth.art) — a browser-only image dithering editor. Users upload an image, pick one of 15 dithering algorithms, tune filters and tone mapping, and export a PNG. Every pixel is processed on the client; nothing is uploaded.

## Stack

- Next.js (App Router, Turbopack), React 19, TypeScript (strict)
- Tailwind CSS 4 (tokens in `src/app/globals.css` `@theme`), shadcn/ui on Radix primitives, lucide icons
- Playwright + axe for end-to-end accessibility tests
- Deployed on Vercel, all routes statically prerendered

## Commands

```bash
npm run dev            # dev server on :3000
npm run build          # production build (also type-checks)
npm run lint:eslint    # eslint (includes jsx-a11y)
npm run test:a11y      # playwright + axe (starts the dev server itself)
npm run perf:bundles   # per-route JS size table, run after `npm run build`
```

Use the `/verify` command to run the whole gate before committing.

## Layout

- `src/app/` — routes. `/` is the landing page; `(studio)/` groups `/editor` and `/algorithms`, which share the studio sidebar and editor providers (state survives navigation between them).
- `src/lib/editor/` — the image pipeline (filters → dither → tone mapping → rescale).
- `src/contexts/` — editor/image/canvas state.
- `src/components/ui/` — shadcn primitives. `src/components/` — app components.

## Conventions

- **Design tokens only.** Use the Tailwind theme tokens (`bg-ink`, `text-paper-dim`, `text-safelight`, `text-label`, …) instead of arbitrary values like `text-[10px]` or `text-[var(--x)]`. Add a token before adding a one-off value.
- **Dark only.** The identity is a photographic darkroom: ink black, paper off-white, a single red safelight accent, mono uppercase technical labels, serif display type. There is no light theme.
- **Keep it light.** Ask before adding runtime dependencies. Prefer platform APIs (Canvas 2D, WebGL, Workers) over graphics libraries.
- **Accessibility is a gate.** Every route must pass axe; interactive canvases need keyboard equivalents; respect `prefers-reduced-motion`; auto-advancing or moving content needs a pause control.
- **Preserve URLs.** `/`, `/editor`, `/algorithms` and the `#algorithm-<slug>` anchors are public; do not break them.
- Prettier with the Tailwind plugin formats everything (`npm run lint:prettier`).
- Commits: conventional style (`feat:`, `fix:`, `refactor:`, `perf:`, `chore:`).
