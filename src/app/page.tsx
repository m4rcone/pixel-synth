import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DitherBackground } from "@/components/dither-background";
import { DitherSpecimen } from "@/components/dither-specimen";
import { StructuredData } from "@/components/structured-data";
import { ALGORITHMS, ALGORITHM_CATEGORIES } from "@/lib/algorithms";
import { absoluteUrl, siteConfig } from "@/lib/site";

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
      className="lab lab-grain bg-ink text-paper relative min-h-screen w-full overflow-x-hidden font-sans focus:outline-hidden"
    >
      <StructuredData data={homeStructuredData} />

      {/* ----------------------------- BACKGROUND ----------------------------- */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute inset-0 [mask-image:radial-gradient(120%_90%_at_85%_-10%,black,transparent_70%)] opacity-[0.4]">
          <DitherBackground />
        </div>
        <div className="lab-grid absolute inset-0 opacity-60" />
        <div className="from-ink/20 via-ink/75 to-ink absolute inset-0 bg-gradient-to-b" />
      </div>

      {/* ------------------------------- CONTENT ------------------------------ */}
      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col px-5 sm:px-8">
        {/* NAV */}
        <header className="flex items-center justify-between py-5">
          <Link href="/" className="group flex items-center gap-2.5">
            <span
              aria-hidden="true"
              className="lab-dots border-line-strong grid size-7 place-items-center rounded-[5px] border text-white/65"
            />
            <span className="font-display text-lg tracking-tight">
              PixelSynth
            </span>
          </Link>
          <nav
            aria-label="Primary"
            className="flex items-center gap-1 font-mono text-[11px] tracking-[0.15em] uppercase sm:gap-2"
          >
            <Link
              href="/algorithms"
              className="text-paper-dim hover:text-paper rounded px-2.5 py-1.5 transition-colors focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
            >
              Algorithms
            </Link>
            <Link
              href="/editor"
              className="text-paper-dim hover:text-paper rounded px-2.5 py-1.5 transition-colors focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
            >
              Editor
            </Link>
            <a
              href={siteConfig.links.github}
              target="_blank"
              rel="noopener noreferrer"
              className="text-paper-dim hover:text-paper hidden rounded px-2.5 py-1.5 transition-colors focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none sm:inline-block"
            >
              GitHub ↗
            </a>
          </nav>
        </header>

        {/* HERO */}
        <section className="grid flex-1 items-center gap-12 py-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="max-w-xl">
            <p
              className="lab-fade border-line-strong text-paper-dim mb-7 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 font-mono text-[10px] tracking-[0.22em] uppercase"
              style={{ animationDelay: "0.05s" }}
            >
              <span className="lab-blink bg-safelight size-1.5 rounded-full" />
              In-browser dithering lab
            </p>

            <h1
              tabIndex={-1}
              className="lab-fade font-display text-[clamp(3.25rem,9vw,6.5rem)] leading-[0.9] tracking-[-0.02em] focus:outline-hidden"
              style={{ animationDelay: "0.12s" }}
            >
              <span className="text-paper-dim block">Smooth in.</span>
              <span className="block">
                <em className="text-paper italic">Dither</em> out.
              </span>
            </h1>

            <p
              className="lab-fade text-paper-dim mt-7 max-w-md text-base leading-relaxed sm:text-lg"
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
                className="border-line-strong text-paper hover:text-paper bg-transparent font-mono text-xs tracking-[0.12em] uppercase hover:bg-white/5"
              >
                <Link href="/algorithms">Browse algorithms</Link>
              </Button>
            </div>

            <dl
              className="lab-fade text-paper-dim mt-10 flex flex-wrap items-center gap-x-3 gap-y-2 font-mono text-[10px] tracking-[0.18em] uppercase"
              style={{ animationDelay: "0.42s" }}
            >
              <Spec value={String(ALGORITHMS.length)} label="Algorithms" />
              <Spec
                value={String(ALGORITHM_CATEGORIES.length)}
                label="Categories"
              />
              <Spec value="100%" label="Local" />
            </dl>
          </div>

          <div className="flex justify-center lg:justify-end">
            <DitherSpecimen />
          </div>
        </section>

        {/* MARQUEE */}
        <section
          aria-label="Available dithering algorithms"
          className="lab-marquee border-line relative -mx-5 overflow-hidden border-y py-4 sm:-mx-8"
        >
          <ul className="sr-only">
            {ALGORITHMS.map((a) => (
              <li key={a.slug}>{a.shortName}</li>
            ))}
          </ul>
          <div
            aria-hidden="true"
            className="lab-marquee-track text-paper-dim flex w-max items-center font-mono text-sm tracking-[0.2em] whitespace-nowrap uppercase"
          >
            {[...ALGORITHMS, ...ALGORITHMS].map((a, i) => (
              <span key={i} className="flex items-center">
                <span className="px-6">{a.shortName}</span>
                <span className="text-safelight">✳</span>
              </span>
            ))}
          </div>
          {/* edge fades */}
          <div className="from-ink pointer-events-none absolute inset-y-0 left-0 w-20 bg-gradient-to-r to-transparent" />
          <div className="from-ink pointer-events-none absolute inset-y-0 right-0 w-20 bg-gradient-to-l to-transparent" />
        </section>

        {/* FEATURES */}
        <section aria-labelledby="features-heading" className="py-16 sm:py-24">
          <div className="mb-8 flex items-baseline justify-between">
            <h2
              id="features-heading"
              className="font-display text-2xl tracking-tight sm:text-3xl"
            >
              A darkroom for pixels
            </h2>
            <span className="text-paper-dim hidden font-mono text-[10px] tracking-[0.2em] uppercase sm:inline">
              / Capabilities
            </span>
          </div>

          <div className="border-line bg-line grid gap-px overflow-hidden rounded-xl border sm:grid-cols-3">
            {FEATURES.map((f) => (
              <article
                key={f.n}
                className="group bg-ink hover:bg-ink-raised p-6 transition-colors sm:p-8"
              >
                <div className="flex items-center justify-between font-mono text-[10px] tracking-[0.2em] uppercase">
                  <span className="text-safelight">{f.n}</span>
                  <span className="text-paper-dim">{f.label}</span>
                </div>
                <h3 className="font-display text-paper mt-6 text-xl leading-snug">
                  {f.title}
                </h3>
                <p className="text-paper-dim mt-3 text-sm leading-relaxed">
                  {f.desc}
                </p>
              </article>
            ))}
          </div>

          {/* Closing CTA strip */}
          <div className="border-line bg-ink-raised/60 mt-12 flex flex-col items-center gap-5 rounded-xl border px-6 py-10 text-center">
            <p className="font-display max-w-lg text-2xl leading-snug sm:text-3xl">
              Drop in an image. Pick an algorithm.{" "}
              <span className="text-paper-dim italic">Watch it develop.</span>
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
        <footer className="border-line mt-auto flex flex-col items-center justify-between gap-3 border-t py-7 text-center sm:flex-row sm:text-left">
          <p className="text-paper-dim font-mono text-[11px] tracking-[0.1em]">
            © 2026 PixelSynth — a dithering image editor
          </p>
          <p className="text-paper-dim font-mono text-[11px] tracking-[0.1em]">
            Built by{" "}
            <a
              href={siteConfig.links.github}
              target="_blank"
              rel="noopener noreferrer"
              className="text-paper underline-offset-4 transition-colors hover:underline"
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
  // dt must precede dd in the DOM; flex order shows "15 Algorithms ·".
  return (
    <div className="[&:not(:last-child)]:after:text-line-strong flex items-center gap-1.5 [&:not(:last-child)]:after:order-3 [&:not(:last-child)]:after:ml-1.5 [&:not(:last-child)]:after:content-['·']">
      <dt className="order-2">{label}</dt>
      <dd className="text-paper order-1">{value}</dd>
    </div>
  );
}
