import Image from "next/image";
import Link from "next/link";
import { DitherBackground } from "@/components/dither-background";
import { DitherSpecimen } from "@/components/dither-specimen";
import { Logo } from "@/components/logo";
import { StructuredData } from "@/components/structured-data";
import { Button } from "@/components/ui/button";
import {
  ALGORITHM_CATEGORIES,
  ALGORITHMS,
  getCategoryName,
} from "@/lib/algorithms";
import { absoluteUrl, siteConfig } from "@/lib/site";

const FEATURES = [
  {
    label: "Algorithms",
    title: "Fifteen ways to break a gradient",
    desc: "Error diffusion, ordered matrices, blue-noise and halftone — from Floyd–Steinberg (1976) to Void-and-Cluster, side by side.",
  },
  {
    label: "Controls",
    title: "Tune the grain in real time",
    desc: "Push scale, contrast, brightness, noise and blur and watch the pixels rearrange instantly, no render queue.",
  },
  {
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

const navLink =
  "rounded-sm px-2 py-1.5 text-sm text-paper-dim transition-colors hover:text-paper focus-visible:ring-2 focus-visible:ring-safelight focus-visible:outline-none";

export default function HomePage() {
  return (
    <div className="darkroom-grain relative min-h-svh overflow-x-clip">
      <StructuredData data={homeStructuredData} />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[52rem] [mask-image:radial-gradient(90%_70%_at_80%_0%,black,transparent_75%)] opacity-35"
      >
        <DitherBackground />
      </div>

      <div className="relative z-10 mx-auto flex min-h-svh max-w-6xl flex-col px-4 sm:px-8">
        <header className="flex items-center justify-between py-5">
          <Link
            href="/"
            aria-label="PixelSynth home"
            className="focus-visible:ring-safelight rounded-sm focus-visible:ring-2 focus-visible:outline-none"
          >
            <Logo />
          </Link>
          <nav
            aria-label="Primary"
            className="flex items-center gap-1 sm:gap-3"
          >
            <Link href="/algorithms" className={navLink}>
              Algorithms
            </Link>
            <Link href="/editor" className={navLink}>
              Editor
            </Link>
            <a
              href={siteConfig.links.github}
              target="_blank"
              rel="noopener noreferrer"
              className={`${navLink} hidden sm:inline-block`}
            >
              GitHub
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </nav>
        </header>

        <main
          id="main-content"
          tabIndex={-1}
          className="flex flex-1 flex-col focus:outline-hidden"
        >
          <section className="develop grid items-center gap-12 pt-10 pb-16 lg:grid-cols-[1.1fr_0.9fr] lg:pt-16 lg:pb-24">
            <div className="max-w-xl">
              <h1
                tabIndex={-1}
                className="font-display text-display font-medium focus:outline-hidden"
              >
                <span className="text-paper-dim block">Smooth in.</span>
                <span className="dithered-text block pb-[0.08em]">
                  Dither out.
                </span>
              </h1>

              <p className="text-paper-dim mt-8 max-w-md text-lg leading-relaxed">
                PixelSynth is an in-browser dithering lab. It turns photographs
                into algorithmic grain with fifteen real dithering algorithms,
                every pixel computed on your device — no uploads, no accounts.
              </p>

              <div className="mt-9 flex flex-wrap items-center gap-3">
                <Button asChild size="lg">
                  <Link href="/editor">Open the editor</Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/algorithms">Browse algorithms</Link>
                </Button>
              </div>

              <dl className="border-line mt-10 grid max-w-md grid-cols-3 border-t pt-5">
                <Fact value={String(ALGORITHMS.length)} label="Algorithms" />
                <Fact
                  value={String(ALGORITHM_CATEGORIES.length)}
                  label="Families"
                />
                <Fact value="100%" label="Local" />
              </dl>
            </div>

            <div className="flex justify-center lg:justify-end">
              <DitherSpecimen />
            </div>
          </section>

          <section aria-labelledby="contact-sheet-heading" className="pb-20">
            <div className="mb-5 flex items-end justify-between gap-4">
              <h2
                id="contact-sheet-heading"
                className="font-display text-heading font-medium"
              >
                One sphere, fifteen prints
              </h2>
              <Link
                href="/algorithms"
                className="text-paper-dim hover:text-paper focus-visible:ring-safelight shrink-0 rounded-sm text-sm whitespace-nowrap underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:outline-none"
              >
                See the catalog
              </Link>
            </div>
            <ol className="border-line bg-ink-sunken -mx-4 flex snap-x scroll-px-4 gap-3 overflow-x-auto border-y px-4 py-4 sm:mx-0 sm:rounded-md sm:border">
              {ALGORITHMS.map((algorithm, index) => (
                <li key={algorithm.slug} className="w-36 shrink-0 snap-start">
                  <Link
                    href={`/algorithms#algorithm-${algorithm.slug}`}
                    className="group focus-visible:ring-safelight block rounded-sm focus-visible:ring-2 focus-visible:outline-none"
                  >
                    <span className="text-readout text-paper-dim group-hover:text-safelight flex justify-between pb-1.5 transition-colors">
                      <span>{String(index + 1).padStart(2, "0")}</span>
                      <span aria-hidden="true">▸</span>
                    </span>
                    <Image
                      src={algorithm.preview}
                      alt=""
                      width={144}
                      height={144}
                      unoptimized
                      className="border-line aspect-square w-full rounded-xs border"
                    />
                    <span className="text-paper mt-2 block truncate text-sm">
                      {algorithm.shortName}
                    </span>
                    <span className="text-paper-dim block text-xs">
                      {getCategoryName(algorithm.category)}
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          </section>

          <section aria-labelledby="features-heading" className="pb-20">
            <h2
              id="features-heading"
              className="font-display text-title mb-10 max-w-lg font-medium"
            >
              A darkroom for pixels
            </h2>
            <div className="grid gap-10 sm:grid-cols-3 sm:gap-8">
              {FEATURES.map((feature) => (
                <article
                  key={feature.label}
                  className="border-line border-t pt-5"
                >
                  <p className="text-label text-safelight">{feature.label}</p>
                  <h3 className="font-display text-heading mt-3 font-medium">
                    {feature.title}
                  </h3>
                  <p className="text-paper-dim mt-3 leading-relaxed">
                    {feature.desc}
                  </p>
                </article>
              ))}
            </div>
          </section>

          <section
            aria-labelledby="cta-heading"
            className="border-line bg-ink-raised/60 mb-16 flex flex-col items-start gap-6 rounded-md border px-6 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-10"
          >
            <p
              id="cta-heading"
              className="font-display text-heading max-w-md font-medium"
            >
              Drop in an image. Pick an algorithm.{" "}
              <span className="text-paper-dim">Watch it develop.</span>
            </p>
            <Button asChild size="lg">
              <Link href="/editor">Start dithering</Link>
            </Button>
          </section>
        </main>

        <footer className="border-line text-paper-dim flex flex-col gap-2 border-t py-7 text-sm sm:flex-row sm:justify-between">
          <p>© 2026 PixelSynth — a dithering image editor</p>
          <p>
            Built by{" "}
            <a
              href={siteConfig.links.github}
              target="_blank"
              rel="noopener noreferrer"
              className="text-paper decoration-line-strong hover:decoration-paper focus-visible:ring-safelight rounded-sm underline underline-offset-4 focus-visible:ring-2 focus-visible:outline-none"
            >
              m4rcone
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
            . Runs entirely in your browser.
          </p>
        </footer>
      </div>
    </div>
  );
}

function Fact({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-paper-dim order-2 text-sm">{label}</dt>
      <dd className="font-display text-heading order-1 font-medium">{value}</dd>
    </div>
  );
}
