import Image from "next/image";
import Link from "next/link";
import { DitherBackground } from "@/components/dither-background";
import { DitherSpecimen } from "@/components/dither-specimen";
import { Logo } from "@/components/logo";
import { SiteFooter } from "@/components/site-footer";
import { StructuredData } from "@/components/structured-data";
import { Button } from "@/components/ui/button";
import { ALGORITHMS, getAlgorithm } from "@/lib/algorithms";
import { faqStructuredData, HOME_FAQ, type FaqPart } from "@/lib/home-faq";
import { getPalettePreset, PALETTE_PRESETS } from "@/lib/palettes";
import {
  PALETTE_PREVIEW_SIZE,
  palettePreview,
  PIXEL_ART_PREVIEW,
} from "@/lib/samples";
import { absoluteUrl, siteConfig } from "@/lib/site";

const SAMPLE_LINK = "/editor?sample=1";
const PIXEL_ART_LINK = "/editor?preset=pixel-art";

const paletteName = (id: string) => getPalettePreset(id)?.name ?? id;
const algorithmName = (slug: string) => getAlgorithm(slug)?.name ?? slug;

const SHOWCASE_PALETTES = [
  "gameboy",
  "nes",
  "pico8",
  "cga-cyan-magenta",
  "riso",
  "cyanotype",
];

type Thumbnail = {
  src: string;
  width: number;
  height: number;
  /** Shown at its natural size with crisp pixels. */
  pixelated?: boolean;
};

const paletteThumbnail = (id: string): Thumbnail => ({
  src: palettePreview(id),
  ...PALETTE_PREVIEW_SIZE,
});

const USE_CASES: {
  title: string;
  text: string;
  image: Thumbnail;
  links: { label: string; href: string }[];
}[] = [
  {
    title: "Pixel art & game assets",
    text: "Shrink a photo to sprite size, snap it to PICO-8, NES or Game Boy and export at ×1 for your engine.",
    image: { ...PIXEL_ART_PREVIEW, pixelated: true },
    links: [
      {
        label: `${paletteName("pico8")} palette`,
        href: "/palettes#palette-pico8",
      },
      { label: "Pixel art preset", href: PIXEL_ART_LINK },
    ],
  },
  {
    title: "Print, zines & risograph",
    text: "Split tones into ink-friendly dots with newsprint, sepia, cyanotype and riso palettes.",
    image: paletteThumbnail("riso"),
    links: [
      {
        label: `${paletteName("riso")} palette`,
        href: "/palettes#palette-riso",
      },
      {
        label: algorithmName("clustered-dot-halftone-ordered"),
        href: "/algorithms/clustered-dot-halftone-ordered",
      },
    ],
  },
  {
    title: "Laser engraving",
    text: "Engravers burn dots, not grays. Floyd–Steinberg, Atkinson or Jarvis give pure black-and-white PNGs.",
    image: {
      src: getAlgorithm("atkinson")?.preview ?? "",
      width: 250,
      height: 250,
    },
    links: [
      { label: algorithmName("atkinson"), href: "/algorithms/atkinson" },
      {
        label: algorithmName("floyd-steinberg"),
        href: "/algorithms/floyd-steinberg",
      },
    ],
  },
  {
    title: "Posters, covers & social",
    text: "A printed, retro texture for album art, posters and posts. Save it up to ×8 with every pixel crisp, or on a transparent background to lay over your own artwork.",
    image: paletteThumbnail("zx-spectrum"),
    links: [{ label: "Try it with a sample", href: SAMPLE_LINK }],
  },
];

const STEPS = [
  {
    title: "Load an image",
    text: "Drop, paste or pick a file. It never leaves your device.",
  },
  {
    title: "Choose the look",
    text: "An algorithm, 1-bit, a palette or CMYK, filters and size.",
  },
  {
    title: "Export",
    text: "Crisp PNG or animated GIF at ×1 to ×8, no watermark.",
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
    screenshot: absoluteUrl(palettePreview("pico8")),
    featureList: [
      `${ALGORITHMS.length} dithering algorithms`,
      `${PALETTE_PRESETS.length} color palettes`,
      "Pixel art preset",
      "Local processing, no uploads",
      "PNG and animated GIF export at ×1 to ×8",
    ],
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
  faqStructuredData(HOME_FAQ),
];

const navLink =
  "text-caps rounded-sm px-2 py-1.5 text-paper-dim transition-colors hover:text-paper focus-visible:ring-2 focus-visible:ring-safelight focus-visible:outline-none";

const textLink =
  "text-paper hover:text-paper-hot hover:decoration-paper-hot focus-visible:ring-safelight decoration-line-strong rounded-sm font-medium underline underline-offset-4 transition-colors focus-visible:ring-2 focus-visible:outline-none";

export default function HomePage() {
  return (
    <div className="scanlines relative min-h-svh overflow-x-clip">
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
            <Logo wordmarkClassName="max-sm:sr-only" />
          </Link>
          <nav
            aria-label="Primary"
            className="flex items-center gap-1 sm:gap-3"
          >
            <Link href="/algorithms" className={navLink}>
              Algorithms
            </Link>
            <Link href="/palettes" className={navLink}>
              Palettes
            </Link>
            <Link href="/editor" className={navLink}>
              Editor
            </Link>
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
                className="font-display text-display font-normal focus:outline-hidden"
              >
                <span className="text-safelight tracking-caps mb-5 block font-sans text-sm font-semibold uppercase">
                  Online image dithering & pixel art converter
                </span>
                <span className="text-paper-dim text-glow block">
                  Smooth in.
                </span>
                <span className="text-glow block">Dither out.</span>
              </h1>

              <p className="text-paper-dim mt-8 max-w-md text-lg leading-relaxed">
                Turn any photo into dithered, 1-bit or pixel art images.{" "}
                {ALGORITHMS.length} algorithms, Game Boy, NES, PICO-8 and CGA
                palettes, crisp PNG and animated GIF exports. Everything runs on
                your device.
              </p>

              <div className="mt-9 flex flex-wrap items-center gap-3">
                <Button asChild size="lg">
                  <Link href="/editor">Open the editor</Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href={SAMPLE_LINK}>Try it with a sample</Link>
                </Button>
              </div>

              <dl className="border-line mt-10 grid max-w-md grid-cols-3 border-t pt-5">
                <Fact value={String(ALGORITHMS.length)} label="Algorithms" />
                <Fact value={String(PALETTE_PRESETS.length)} label="Palettes" />
                <Fact value="0" label="Uploads" />
              </dl>
            </div>

            <div className="flex justify-center lg:justify-end">
              <DitherSpecimen />
            </div>
          </section>

          <section aria-labelledby="palettes-heading" className="pb-20">
            <div className="mb-8 flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
              <div className="flex max-w-2xl flex-col gap-4">
                <h2
                  id="palettes-heading"
                  className="font-display text-glow text-title font-normal"
                >
                  Classic palettes, one click away
                </h2>
                <p className="text-paper-dim text-lg leading-relaxed">
                  Dither straight to the colors of the Game Boy, NES, PICO-8,
                  CGA or a risograph, or to colors taken from your own image.
                </p>
              </div>
              <Link href="/palettes" className={`${textLink} text-sm`}>
                See all {PALETTE_PRESETS.length} palettes
              </Link>
            </div>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-6">
              {SHOWCASE_PALETTES.map((id) => (
                <li key={id}>
                  <Link
                    href={`/palettes#palette-${id}`}
                    className="group focus-visible:ring-safelight focus-visible:ring-offset-ink flex flex-col gap-2 rounded-sm focus-visible:ring-2 focus-visible:ring-offset-4 focus-visible:outline-none"
                  >
                    {/* Downscaled below 480 px wide: smooth, not pixelated.
                        Stays PNG: dithered noise compresses better lossless
                        than as a lossy WebP. */}
                    <Image
                      src={palettePreview(id)}
                      alt=""
                      width={PALETTE_PREVIEW_SIZE.width}
                      height={PALETTE_PREVIEW_SIZE.height}
                      unoptimized
                      className="border-line group-hover:border-line-strong bg-ink-sunken w-full rounded-xs border transition-colors"
                    />
                    <span className="text-paper-dim group-hover:text-paper text-sm transition-colors">
                      {paletteName(id)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section
            aria-labelledby="pixel-art-heading"
            className="grid items-center gap-8 pb-20 lg:grid-cols-2 lg:gap-12"
          >
            <figure className="border-line-strong bg-ink-raised rounded-md border p-3">
              <Image
                src={PIXEL_ART_PREVIEW.src}
                alt={`The sample image at ${PIXEL_ART_PREVIEW.width} by ${PIXEL_ART_PREVIEW.height} pixels, PICO-8 palette, 2×2 Bayer pattern`}
                width={PIXEL_ART_PREVIEW.width}
                height={PIXEL_ART_PREVIEW.height}
                unoptimized
                className="w-full rounded-xs [image-rendering:pixelated]"
              />
              <figcaption className="text-readout text-paper-dim mt-2">
                {PIXEL_ART_PREVIEW.width} × {PIXEL_ART_PREVIEW.height} px, shown
                enlarged
              </figcaption>
            </figure>
            <div className="flex max-w-lg flex-col gap-5">
              <h2
                id="pixel-art-heading"
                className="font-display text-glow text-title font-normal"
              >
                Photo to pixel art in one click
              </h2>
              <p className="text-paper-dim text-lg leading-relaxed">
                The pixel art preset shrinks any image to about 128 × 96 pixels,
                snaps it to PICO-8 with a 2×2 Bayer pattern and exports crisp at
                ×4 or ×8.
              </p>
              <Button asChild size="lg" className="self-start">
                <Link href={PIXEL_ART_LINK}>Try the pixel art preset</Link>
              </Button>
            </div>
          </section>

          <section aria-labelledby="use-cases-heading" className="pb-20">
            <div className="mb-10 flex max-w-2xl flex-col gap-4">
              <h2
                id="use-cases-heading"
                className="font-display text-glow text-title font-normal"
              >
                A darkroom for pixels
              </h2>
              <p className="text-paper-dim text-lg leading-relaxed">
                {ALGORITHMS.length} algorithms, from Floyd–Steinberg (1976) to
                blue noise and angled halftone screens of dots or lines. Tune
                scale, contrast, saturation, noise and blur, soften the error
                diffusion for cleaner areas, and map your own colors to shadows,
                midtones and highlights.
              </p>
            </div>
            <ul className="grid gap-5 md:grid-cols-2">
              {USE_CASES.map((useCase) => (
                <li
                  key={useCase.title}
                  className="border-line bg-ink-raised/60 flex flex-col gap-5 rounded-md border p-5 sm:flex-row"
                >
                  <Image
                    src={useCase.image.src}
                    alt=""
                    width={useCase.image.width}
                    height={useCase.image.height}
                    unoptimized
                    className={
                      useCase.image.pixelated
                        ? "border-line bg-ink-sunken aspect-3/2 w-34 shrink-0 self-start rounded-xs border object-cover [image-rendering:pixelated]"
                        : "border-line bg-ink-sunken aspect-3/2 w-34 shrink-0 self-start rounded-xs border object-cover"
                    }
                  />
                  <div className="flex flex-col gap-2">
                    <h3 className="text-heading font-semibold">
                      {useCase.title}
                    </h3>
                    <p className="text-paper-dim leading-relaxed">
                      {useCase.text}
                    </p>
                    <ul className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                      {useCase.links.map((link) => (
                        <li key={link.href}>
                          <Link href={link.href} className={textLink}>
                            {link.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="how-heading" className="pb-20">
            <h2
              id="how-heading"
              className="font-display text-glow text-title mb-10 font-normal"
            >
              How it works
            </h2>
            <ol className="grid gap-8 sm:grid-cols-3">
              {STEPS.map((step, index) => (
                <li key={step.title} className="border-line border-t pt-5">
                  <span
                    aria-hidden="true"
                    className="text-readout text-paper-dim"
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3 className="text-heading mt-3 font-semibold">
                    {step.title}
                  </h3>
                  <p className="text-paper-dim mt-2 leading-relaxed">
                    {step.text}
                  </p>
                </li>
              ))}
            </ol>
          </section>

          <section aria-labelledby="faq-heading" className="pb-20">
            <h2
              id="faq-heading"
              className="font-display text-glow text-title mb-8 font-normal"
            >
              Frequently asked questions
            </h2>
            <div className="border-line max-w-3xl border-b">
              {HOME_FAQ.map((entry) => (
                <details key={entry.question} className="border-line border-t">
                  <summary className="marker:text-paper-dim focus-visible:ring-safelight cursor-pointer rounded-sm py-4 text-lg font-medium focus-visible:ring-2 focus-visible:outline-none">
                    {entry.question}
                  </summary>
                  <p className="text-paper-dim pb-5 leading-relaxed">
                    <FaqAnswer parts={entry.answer} />
                  </p>
                </details>
              ))}
            </div>
          </section>

          <section
            aria-labelledby="cta-heading"
            className="border-line bg-ink-raised/60 mb-16 flex flex-col items-start gap-6 rounded-md border px-6 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-10"
          >
            <p id="cta-heading" className="text-heading max-w-md font-semibold">
              Drop in an image. Pick an algorithm.{" "}
              <span className="text-paper-dim">Watch it develop.</span>
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/editor">Start dithering</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href={SAMPLE_LINK}>Try it with a sample</Link>
              </Button>
            </div>
          </section>
        </main>

        <SiteFooter />
      </div>
    </div>
  );
}

function Fact({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-paper-dim order-2 text-sm">{label}</dt>
      <dd className="font-display text-glow order-1 text-2xl font-normal">
        {value}
      </dd>
    </div>
  );
}

function FaqAnswer({ parts }: { parts: FaqPart[] }) {
  return parts.map((part, index) =>
    typeof part === "string" ? (
      part
    ) : (
      <Link key={index} href={part.href} className={textLink}>
        {part.text}
      </Link>
    ),
  );
}
