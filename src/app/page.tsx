import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BackgroundDitherLoader } from "@/components/background-dither-loader";
import { DitherSpecimen } from "@/components/dither-specimen";
import { StructuredData } from "@/components/structured-data";
import { absoluteUrl, siteConfig } from "@/lib/site";

const ALGORITHMS = [
  "Floyd–Steinberg",
  "Jarvis–Judice–Ninke",
  "Stucki",
  "Burkes",
  "Sierra",
  "Two-Row Sierra",
  "Sierra Lite",
  "Atkinson",
  "Bayer 2×2",
  "Bayer 4×4",
  "Bayer 8×8",
  "Clustered Dot",
  "Blue Noise",
  "Random",
  "Void-and-Cluster",
];

const FEATURES = [
  {
    n: "01",
    label: "Algorithms",
    title: "Fifteen ways to break a gradient",
    desc: "Error diffusion, ordered matrices, blue-noise and halftone — from Floyd–Steinberg (1976) to Void-and-Cluster, side by side.",
  },
  {
    n: "02",
    label: "Controls",
    title: "Tune the grain in real time",
    desc: "Push scale, contrast, brightness, noise and blur and watch the pixels rearrange instantly, no render queue.",
  },
  {
    n: "03",
    label: "Tone mapping",
    title: "Color where you want it",
    desc: "Map custom shades to shadows, midtones and highlights while luminance is preserved across the image.",
  },
];

const homeStructuredData = [
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    url: siteConfig.url,
    description: siteConfig.description,
    inLanguage: "en",
    publisher: {
      "@type": "Person",
      name: siteConfig.creator,
      url: siteConfig.links.github,
    },
  },
  {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: siteConfig.name,
    url: siteConfig.url,
    description: siteConfig.description,
    applicationCategory: "MultimediaApplication",
    browserRequirements: "Requires a modern web browser",
    operatingSystem: "Web",
    isAccessibleForFree: true,
    image: absoluteUrl(siteConfig.previewImage),
    creator: {
      "@type": "Person",
      name: siteConfig.creator,
      url: siteConfig.links.github,
    },
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  },
];

export default function HomePage() {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="lab lab-grain font-sans relative min-h-screen w-full overflow-x-hidden bg-[var(--ink)] text-[var(--paper)] focus:outline-hidden"
    >
      <StructuredData data={homeStructuredData} />

      {/* ----------------------------- BACKGROUND ----------------------------- */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute inset-0 opacity-[0.4] [mask-image:radial-gradient(120%_90%_at_85%_-10%,black,transparent_70%)]">
          <BackgroundDitherLoader
            waveColor={[0.46, 0.46, 0.5]}
            disableAnimation={false}
            enableMouseInteraction={false}
            mouseRadius={0.3}
            colorNum={4}
            waveAmplitude={0.28}
            waveFrequency={3}
            waveSpeed={0.04}
          />
        </div>
        <div className="lab-grid absolute inset-0 opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--ink)]/20 via-[var(--ink)]/75 to-[var(--ink)]" />
      </div>

      {/* ------------------------------- CONTENT ------------------------------ */}
      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col px-5 sm:px-8">
        {/* NAV */}
        <header className="flex items-center justify-between py-5">
          <Link href="/" className="group flex items-center gap-2.5">
            <span
              aria-hidden="true"
              className="lab-dots grid size-7 place-items-center rounded-[5px] border border-[var(--line-strong)] text-white/65"
            />
            <span className="font-display text-lg tracking-tight">
              PixelSynth
            </span>
          </Link>
          <nav
            aria-label="Primary"
            className="font-mono flex items-center gap-1 text-[11px] tracking-[0.15em] uppercase sm:gap-2"
          >
            <Link
              href="/algorithms"
              className="rounded px-2.5 py-1.5 text-[var(--paper-dim)] transition-colors hover:text-[var(--paper)] focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
            >
              Algorithms
            </Link>
            <Link
              href="/editor"
              className="rounded px-2.5 py-1.5 text-[var(--paper-dim)] transition-colors hover:text-[var(--paper)] focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
            >
              Editor
            </Link>
            <a
              href={siteConfig.links.github}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden rounded px-2.5 py-1.5 text-[var(--paper-dim)] transition-colors hover:text-[var(--paper)] focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none sm:inline-block"
            >
              GitHub ↗
            </a>
          </nav>
        </header>

        {/* HERO */}
        <section className="grid flex-1 items-center gap-12 py-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="max-w-xl">
            <p
              className="lab-fade font-mono mb-7 inline-flex items-center gap-2 rounded-full border border-[var(--line-strong)] px-3 py-1.5 text-[10px] tracking-[0.22em] text-[var(--paper-dim)] uppercase"
              style={{ animationDelay: "0.05s" }}
            >
              <span className="lab-blink size-1.5 rounded-full bg-[var(--safelight)]" />
              In-browser dithering lab
            </p>

            <h1
              tabIndex={-1}
              className="lab-fade font-display text-[clamp(3.25rem,9vw,6.5rem)] leading-[0.9] tracking-[-0.02em] focus:outline-hidden"
              style={{ animationDelay: "0.12s" }}
            >
              <span className="block text-[var(--paper-dim)]">Smooth in.</span>
              <span className="block">
                <em className="text-[var(--paper)] italic">Dither</em> out.
              </span>
            </h1>

            <p
              className="lab-fade mt-7 max-w-md text-base leading-relaxed text-[var(--paper-dim)] sm:text-lg"
              style={{ animationDelay: "0.22s" }}
            >
              PixelSynth turns photographs into algorithmic grain. Fifteen real
              dithering algorithms, every pixel computed in your browser — no
              uploads, no accounts.
            </p>

            <div
              className="lab-fade mt-9 flex flex-wrap items-center gap-3"
              style={{ animationDelay: "0.32s" }}
            >
              <Button
                asChild
                size="lg"
                className="font-mono text-xs tracking-[0.12em] uppercase"
              >
                <Link href="/editor">Open the editor</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="font-mono border-[var(--line-strong)] bg-transparent text-xs tracking-[0.12em] text-[var(--paper)] uppercase hover:bg-white/5 hover:text-[var(--paper)]"
              >
                <Link href="/algorithms">Browse algorithms</Link>
              </Button>
            </div>

            <dl
              className="lab-fade font-mono mt-10 flex flex-wrap items-center gap-x-3 gap-y-2 text-[10px] tracking-[0.18em] text-[var(--paper-dim)] uppercase"
              style={{ animationDelay: "0.42s" }}
            >
              <Spec value="15" label="Algorithms" />
              <Dot />
              <Spec value="5" label="Categories" />
              <Dot />
              <Spec value="100%" label="Local" />
              <Dot />
              <Spec value="Est. 1976" label="" />
            </dl>
          </div>

          <div className="flex justify-center lg:justify-end">
            <DitherSpecimen />
          </div>
        </section>

        {/* MARQUEE */}
        <section
          aria-label="Available dithering algorithms"
          className="lab-marquee relative -mx-5 overflow-hidden border-y border-[var(--line)] py-4 sm:-mx-8"
        >
          <ul className="sr-only">
            {ALGORITHMS.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
          <div
            aria-hidden="true"
            className="lab-marquee-track font-mono flex w-max items-center text-sm tracking-[0.2em] whitespace-nowrap text-[var(--paper-dim)] uppercase"
          >
            {[...ALGORITHMS, ...ALGORITHMS].map((a, i) => (
              <span key={i} className="flex items-center">
                <span className="px-6">{a}</span>
                <span className="text-[var(--safelight)]">✳</span>
              </span>
            ))}
          </div>
          {/* edge fades */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-[var(--ink)] to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-[var(--ink)] to-transparent" />
        </section>

        {/* FEATURES */}
        <section
          aria-labelledby="features-heading"
          className="py-16 sm:py-24"
        >
          <div className="mb-8 flex items-baseline justify-between">
            <h2
              id="features-heading"
              className="font-display text-2xl tracking-tight sm:text-3xl"
            >
              A darkroom for pixels
            </h2>
            <span className="font-mono hidden text-[10px] tracking-[0.2em] text-[var(--paper-dim)] uppercase sm:inline">
              / Capabilities
            </span>
          </div>

          <div className="grid gap-px overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--line)] sm:grid-cols-3">
            {FEATURES.map((f) => (
              <article
                key={f.n}
                className="group bg-[var(--ink)] p-6 transition-colors hover:bg-[var(--ink-2)] sm:p-8"
              >
                <div className="font-mono flex items-center justify-between text-[10px] tracking-[0.2em] uppercase">
                  <span className="text-[var(--safelight)]">{f.n}</span>
                  <span className="text-[var(--paper-dim)]">{f.label}</span>
                </div>
                <h3 className="font-display mt-6 text-xl leading-snug text-[var(--paper)]">
                  {f.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-[var(--paper-dim)]">
                  {f.desc}
                </p>
              </article>
            ))}
          </div>

          {/* Closing CTA strip */}
          <div className="mt-12 flex flex-col items-center gap-5 rounded-xl border border-[var(--line)] bg-[var(--ink-2)]/60 px-6 py-10 text-center">
            <p className="font-display max-w-lg text-2xl leading-snug sm:text-3xl">
              Drop in an image. Pick an algorithm.{" "}
              <span className="italic text-[var(--paper-dim)]">
                Watch it develop.
              </span>
            </p>
            <Button
              asChild
              size="lg"
              className="font-mono text-xs tracking-[0.12em] uppercase"
            >
              <Link href="/editor">Start dithering</Link>
            </Button>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="mt-auto flex flex-col items-center justify-between gap-3 border-t border-[var(--line)] py-7 text-center sm:flex-row sm:text-left">
          <p className="font-mono text-[11px] tracking-[0.1em] text-[var(--paper-dim)]">
            © 2025 PixelSynth — a dithering image editor
          </p>
          <p className="font-mono text-[11px] tracking-[0.1em] text-[var(--paper-dim)]">
            Built by{" "}
            <a
              href={siteConfig.links.github}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--paper)] underline-offset-4 transition-colors hover:underline"
            >
              m4rcone
            </a>{" "}
            · Runs entirely in your browser
          </p>
        </footer>
      </div>
    </main>
  );
}

function Spec({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <dt className="sr-only">{label || value}</dt>
      <dd className="text-[var(--paper)]">{value}</dd>
      {label ? <span>{label}</span> : null}
    </div>
  );
}

function Dot() {
  return (
    <span aria-hidden="true" className="text-[var(--line-strong)]">
      ·
    </span>
  );
}
