import Image from "next/image";
import Link from "next/link";
import { AnimatedGifDemo } from "@/components/landing/animated-gif-demo";
import {
  HeroInstrument,
  type HeroPaletteInfo,
} from "@/components/landing/hero-instrument";
import { Logo } from "@/components/logo";
import { SiteFooter } from "@/components/site-footer";
import { StructuredData } from "@/components/structured-data";
import { Button } from "@/components/ui/button";
import {
  ALGORITHM_CATEGORIES,
  ALGORITHMS,
  getAlgorithm,
} from "@/lib/algorithms";
import { MAX_ANIMATION_FRAMES } from "@/lib/editor/animation-limits";
import { EXPORT_FACTORS } from "@/lib/editor/export";
import { SUPPORTED_IMAGE_TYPES } from "@/lib/editor/load-image";
import { PIXEL_ART_PRESET } from "@/lib/editor/pixel-art";
import { DEFAULT_SETTINGS } from "@/lib/editor/settings";
import { encodeSettings, SHARE_PARAM } from "@/lib/editor/share";
import { faqStructuredData, HOME_FAQ, type FaqPart } from "@/lib/home-faq";
import {
  getPalettePreset,
  PALETTE_GROUPS,
  PALETTE_PRESETS,
} from "@/lib/palettes";
import {
  ANIMATED_DITHER,
  ANIMATED_SAMPLE,
  HERO_ALGORITHMS,
  HERO_ORIGINAL,
  HERO_PALETTES,
  HERO_SIZE,
  heroVariant,
  PALETTE_PREVIEW_SIZE,
  palettePreview,
  PIXEL_ART_PREVIEW,
  SAMPLE_IMAGE,
} from "@/lib/samples";
import { absoluteUrl, siteConfig } from "@/lib/site";

const SAMPLE_LINK = "/editor?sample=1";
const ANIMATED_SAMPLE_LINK = "/editor?sample=animated";
const PIXEL_ART_LINK = "/editor?preset=pixel-art";
/** The sample, halftone screens, separated into CMYK. */
const CMYK_LINK = `/editor?sample=1&${SHARE_PARAM}=${encodeSettings(
  {
    ...DEFAULT_SETTINGS,
    algorithm: "halftone",
    color: { ...DEFAULT_SETTINGS.color, mode: "cmyk" },
  },
  true,
)}`;

const paletteName = (id: string) => getPalettePreset(id)?.name ?? id;
const algorithmName = (slug: string) => getAlgorithm(slug)?.shortName ?? slug;

const HERO_ALGORITHM_LIST = HERO_ALGORITHMS.map((id) => ({
  id,
  name: algorithmName(id),
}));

const HERO_PALETTE_LIST = HERO_PALETTES.map((id): HeroPaletteInfo => {
  const preset = getPalettePreset(id);
  return preset
    ? { id, name: preset.name, colors: preset.colors.length, param: id }
    : { id, name: "1-bit", colors: 2, param: null };
});

const HERO_VARIANTS = Object.fromEntries(
  HERO_ALGORITHMS.flatMap((algorithm) =>
    HERO_PALETTES.map((palette) => [
      `${algorithm}:${palette}`,
      heroVariant(algorithm, palette),
    ]),
  ),
);

const MAX_EXPORT_FACTOR = EXPORT_FACTORS.at(-1);
const INPUT_FORMATS = SUPPORTED_IMAGE_TYPES.map((type) =>
  type.replace("image/", "").replace("jpeg", "JPEG").toUpperCase(),
)
  .join(", ")
  .replace("WEBP", "WebP");

/** The equipment plate: the practical answers before the FAQ. */
const SPECS: { label: string; value: string; numeric?: boolean }[] = [
  { label: "Algorithms", value: String(ALGORITHMS.length), numeric: true },
  { label: "Palettes", value: String(PALETTE_PRESETS.length), numeric: true },
  { label: "Uploads", value: "0", numeric: true },
  { label: "PNG export", value: `×1 to ×${MAX_EXPORT_FACTOR}` },
  { label: "Animated GIF", value: `Up to ${MAX_ANIMATION_FRAMES} frames` },
  { label: "Opens", value: INPUT_FORMATS },
];

type Thumbnail = {
  src: string;
  width: number;
  height: number;
  /** Shown enlarged with crisp pixels. */
  pixelated?: boolean;
};

const MODES: {
  title: string;
  text: string;
  image: Thumbnail;
  params: [string, string][];
  links: { label: string; href: string }[];
}[] = [
  {
    title: "Pixel art & game assets",
    text: "Shrink a photo to sprite size, snap it to a console palette and export at ×1 for your engine.",
    image: { ...PIXEL_ART_PREVIEW, pixelated: true },
    params: [
      ["Algorithm", algorithmName(PIXEL_ART_PRESET.algorithm)],
      ["Palette", paletteName(PIXEL_ART_PRESET.palette)],
      ["Size", `≈ ${PIXEL_ART_PREVIEW.width} × ${PIXEL_ART_PREVIEW.height}`],
    ],
    links: [
      { label: "Pixel art preset", href: PIXEL_ART_LINK },
      {
        label: `${paletteName("pico8")} palette`,
        href: "/palettes#palette-pico8",
      },
    ],
  },
  {
    title: "Print, zines & risograph",
    text: "Split an image into CMYK and screen each ink at its classic angle, or print in two riso colors.",
    image: {
      src: palettePreview("riso"),
      ...PALETTE_PREVIEW_SIZE,
    },
    params: [
      ["Color", "CMYK separation"],
      ["Screen", algorithmName("halftone")],
      ["Two inks", paletteName("riso")],
    ],
    links: [
      { label: "Try CMYK separation", href: CMYK_LINK },
      {
        label: algorithmName("clustered-dot-halftone-ordered"),
        href: "/algorithms/clustered-dot-halftone-ordered",
      },
      {
        label: `${paletteName("riso")} palette`,
        href: "/palettes#palette-riso",
      },
    ],
  },
  {
    title: "Laser engraving",
    text: "Engravers burn dots, not grays: error diffusion gives pure black-and-white PNGs.",
    image: {
      src: getAlgorithm("atkinson")?.preview ?? "",
      width: 250,
      height: 250,
    },
    params: [
      ["Color", "1-bit"],
      ["Algorithm", "Atkinson or Floyd–Steinberg"],
      ["Export", "PNG ×1"],
    ],
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
    text: "A printed, retro texture for album art, posters and posts, crisp at any size or on a transparent background.",
    image: {
      src: palettePreview("zx-spectrum"),
      ...PALETTE_PREVIEW_SIZE,
    },
    params: [
      ["Export", `PNG up to ×${MAX_EXPORT_FACTOR}`],
      ["Background", "Transparent"],
      ["Palette", "Any, or your own"],
    ],
    links: [
      {
        label: `${paletteName("zx-spectrum")} palette`,
        href: "/palettes#palette-zx-spectrum",
      },
      { label: "Your own colors", href: "/palettes#palette-custom" },
    ],
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
    screenshot: absoluteUrl(heroVariant("atkinson", "gameboy")),
    featureList: [
      `${ALGORITHMS.length} dithering algorithms`,
      `${PALETTE_PRESETS.length} color palettes`,
      "Pixel art preset",
      "CMYK separation",
      "Local processing, no uploads",
      `PNG and animated GIF export at ×1 to ×${MAX_EXPORT_FACTOR}`,
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

const focusRing =
  "outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-safelight";

const navLink = `text-caps px-2 py-1.5 text-paper-dim transition-colors hover:text-paper ${focusRing}`;

const textLink = `text-paper hover:text-paper-hot hover:decoration-paper-hot decoration-line-strong underline underline-offset-4 transition-colors ${focusRing}`;

export default function HomePage() {
  return (
    <div className="scanlines relative min-h-svh overflow-x-clip">
      <StructuredData data={homeStructuredData} />

      <header className="border-line bg-ink/90 sticky top-0 z-20 border-b backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-8">
          <Link href="/" aria-label="PixelSynth home" className={focusRing}>
            <Logo wordmarkClassName="max-sm:sr-only" />
          </Link>
          <nav aria-label="Primary" className="flex items-center sm:gap-2">
            <Link href="/algorithms" className={navLink}>
              Algorithms
            </Link>
            <Link href="/palettes" className={navLink}>
              Palettes
            </Link>
            <Link href="/editor" className={navLink}>
              Editor
            </Link>
            <a
              href={siteConfig.links.repository}
              target="_blank"
              rel="noopener noreferrer"
              className={`${navLink} max-sm:hidden`}
            >
              GitHub<span className="sr-only"> (opens in a new tab)</span>
            </a>
          </nav>
          <p className="text-caps text-paper-dim flex items-center gap-2 max-lg:hidden">
            <span aria-hidden="true" className="bg-safelight size-2" />
            Local · 0 uploads
          </p>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl flex-col px-4 sm:px-8">
        <main
          id="main-content"
          tabIndex={-1}
          className="flex flex-1 flex-col focus:outline-hidden"
        >
          <section className="grid items-center gap-12 pt-12 pb-16 lg:grid-cols-2 lg:pt-20 lg:pb-20">
            <div className="flex max-w-xl flex-col gap-7">
              <p className="text-caps text-paper-dim">
                Specimen: {SAMPLE_IMAGE.name} · {SAMPLE_IMAGE.width} ×{" "}
                {SAMPLE_IMAGE.height} · sRGB
              </p>
              <h1
                tabIndex={-1}
                className="font-display text-display font-normal focus:outline-hidden"
              >
                <span className="text-safelight tracking-caps mb-5 block font-sans text-sm font-semibold uppercase">
                  Online dithering & pixel art converter
                </span>
                <span className="text-glow block">Smooth in.</span>
                <span className="text-glow block">Dither out.</span>
              </h1>

              <p className="text-paper-dim max-w-md text-lg leading-relaxed">
                Turn photos and animated GIFs into 1-bit, halftone or pixel art.{" "}
                {ALGORITHMS.length} algorithms, {PALETTE_PRESETS.length}{" "}
                palettes from Game Boy to risograph. Every pixel is processed on
                your device.
              </p>

              <div className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  <Button asChild size="lg">
                    <Link href="/editor">Open the editor</Link>
                  </Button>
                  <Button asChild size="lg" variant="outline">
                    <Link href={SAMPLE_LINK}>Try the sample</Link>
                  </Button>
                </div>
                <p className="text-caps text-paper-dim">
                  No account · No watermark · No upload
                </p>
              </div>

              <ol
                aria-label="How it works"
                className="text-caps text-paper flex flex-wrap items-center gap-x-3 gap-y-1"
              >
                {["Load", "Tune", "Export"].map((step, index) => (
                  <li key={step} className="flex items-center gap-3">
                    {index > 0 && (
                      <span aria-hidden="true" className="text-paper-dim">
                        →
                      </span>
                    )}
                    {step}
                  </li>
                ))}
              </ol>
            </div>

            <HeroInstrument
              algorithms={HERO_ALGORITHM_LIST}
              palettes={HERO_PALETTE_LIST}
              variants={HERO_VARIANTS}
              size={HERO_SIZE}
              original={HERO_ORIGINAL}
            />
          </section>

          <section aria-label="Specifications" className="pb-20">
            <dl className="border-line-strong bg-ink-raised grid grid-cols-2 border sm:grid-cols-3 lg:grid-cols-6">
              {SPECS.map((spec) => (
                <div
                  key={spec.label}
                  className="border-line flex flex-col gap-2 border-t border-l p-4"
                >
                  <dt className="text-caps text-paper-dim order-2">
                    {spec.label}
                  </dt>
                  <dd
                    className={
                      spec.numeric
                        ? "font-display text-glow order-1 text-2xl"
                        : "order-1 text-sm leading-snug"
                    }
                  >
                    {spec.value}
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          <section aria-labelledby="algorithms-heading" className="pb-20">
            <SectionHead
              id="algorithms-heading"
              title={`Same image, ${ALGORITHMS.length} dithering algorithms`}
              link={{ label: "Compare them all", href: "/algorithms" }}
            >
              One sphere, every algorithm the editor has, from Floyd–Steinberg
              (1976) to blue noise and angled halftone screens.
            </SectionHead>
            <div className="flex flex-col gap-10">
              {ALGORITHM_CATEGORIES.map((category) => (
                <div key={category.id} className="flex flex-col gap-4">
                  <h3 className="text-caps text-paper">{category.name}</h3>
                  <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-8">
                    {ALGORITHMS.filter(
                      (algorithm) => algorithm.category === category.id,
                    ).map((algorithm) => (
                      <li key={algorithm.slug}>
                        <Link
                          href={`/algorithms/${algorithm.slug}`}
                          className={`group border-line-strong bg-ink-raised hover:border-paper flex h-full flex-col border transition-colors ${focusRing}`}
                        >
                          <Image
                            src={algorithm.preview}
                            alt=""
                            width={250}
                            height={250}
                            // Shown smaller than 250 px: smooth, not pixelated.
                            unoptimized
                            className="bg-ink-sunken border-line w-full border-b"
                          />
                          <span className="flex flex-col gap-1 p-3">
                            <span className="group-hover:text-paper-hot text-sm font-semibold">
                              {algorithm.shortName}
                            </span>
                            <span className="text-readout text-paper-dim">
                              {[algorithm.author, algorithm.year]
                                .filter(Boolean)
                                .join(" · ") || "Classic technique"}
                            </span>
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          <section aria-labelledby="palettes-heading" className="pb-20">
            <SectionHead
              id="palettes-heading"
              title="Retro palettes: Game Boy, NES, PICO-8, CGA"
              link={{
                label: `All ${PALETTE_PRESETS.length} palettes`,
                href: "/palettes",
              }}
            >
              Dither straight to the colors of a console, a print process or
              your own image. Each palette matches by color or by brightness.
            </SectionHead>
            <div className="flex flex-col gap-10">
              {PALETTE_GROUPS.filter((group) =>
                PALETTE_PRESETS.some((palette) => palette.group === group),
              ).map((group) => (
                <div key={group} className="flex flex-col gap-4">
                  <h3 className="text-caps text-paper">{group}</h3>
                  <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {PALETTE_PRESETS.filter(
                      (palette) => palette.group === group,
                    ).map((palette) => (
                      <PaletteCartridge key={palette.id} id={palette.id} />
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          <section
            aria-labelledby="pixel-art-heading"
            className="grid items-center gap-8 pb-20 lg:grid-cols-2 lg:gap-12"
          >
            <figure className="border-line-strong bg-ink-sunken border p-3">
              <Image
                src={PIXEL_ART_PREVIEW.src}
                alt={`The sample image at ${PIXEL_ART_PREVIEW.width} by ${PIXEL_ART_PREVIEW.height} pixels, PICO-8 palette, 2×2 Bayer pattern`}
                width={PIXEL_ART_PREVIEW.width}
                height={PIXEL_ART_PREVIEW.height}
                unoptimized
                className="w-full [image-rendering:pixelated]"
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

          <section
            aria-labelledby="gif-heading"
            className="grid items-center gap-8 pb-20 lg:grid-cols-2 lg:gap-12"
          >
            <div className="flex max-w-lg flex-col gap-5 lg:order-2">
              <h2
                id="gif-heading"
                className="font-display text-glow text-title font-normal"
              >
                Dither animated GIFs
              </h2>
              <p className="text-paper-dim text-lg leading-relaxed">
                Open a GIF and every frame is dithered with one shared palette,
                so colors hold still from frame to frame. Up to{" "}
                {MAX_ANIMATION_FRAMES} frames, exported as a GIF that loops like
                the original.
              </p>
              <Link
                href={ANIMATED_SAMPLE_LINK}
                className={`${textLink} self-start`}
              >
                Open the animated sample
              </Link>
            </div>
            <AnimatedGifDemo
              src={ANIMATED_DITHER.src}
              still={ANIMATED_DITHER.still}
              width={ANIMATED_DITHER.width}
              height={ANIMATED_DITHER.height}
              alt={`The animated sample, a sun rising and setting, dithered with ${algorithmName(ANIMATED_DITHER.algorithm)} and the ${paletteName(ANIMATED_DITHER.palette)} palette`}
              caption={`${ANIMATED_SAMPLE.frames} frames · ${ANIMATED_SAMPLE.delay} ms · ${algorithmName(ANIMATED_DITHER.algorithm)} · ${paletteName(ANIMATED_DITHER.palette)}`}
            />
          </section>

          <section aria-labelledby="modes-heading" className="pb-20">
            <SectionHead
              id="modes-heading"
              title="For pixel art, print, riso and laser"
            >
              Four ways people use it, with the settings to start from.
            </SectionHead>
            <ul className="grid gap-4 md:grid-cols-2">
              {MODES.map((mode) => (
                <li
                  key={mode.title}
                  className="border-line-strong bg-ink-raised flex flex-col gap-5 border p-5 sm:flex-row"
                >
                  <Image
                    src={mode.image.src}
                    alt=""
                    width={mode.image.width}
                    height={mode.image.height}
                    unoptimized
                    className={
                      mode.image.pixelated
                        ? "border-line bg-ink-sunken aspect-3/2 w-34 shrink-0 self-start border object-cover [image-rendering:pixelated]"
                        : "border-line bg-ink-sunken aspect-3/2 w-34 shrink-0 self-start border object-cover"
                    }
                  />
                  <div className="flex min-w-0 flex-col gap-3">
                    <h3 className="text-heading font-semibold">{mode.title}</h3>
                    <p className="text-paper-dim leading-relaxed">
                      {mode.text}
                    </p>
                    <dl className="border-line flex flex-col gap-1 border-t pt-3">
                      {mode.params.map(([label, value]) => (
                        <div key={label} className="flex items-baseline gap-3">
                          <dt className="text-caps text-paper-dim w-24 shrink-0">
                            {label}
                          </dt>
                          <dd className="text-readout">{value}</dd>
                        </div>
                      ))}
                    </dl>
                    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                      {mode.links.map((link) => (
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

          <section aria-labelledby="faq-heading" className="pb-20">
            <h2
              id="faq-heading"
              className="font-display text-glow text-title mb-8 font-normal"
            >
              Frequently asked questions
            </h2>
            <div className="border-line max-w-3xl border-b">
              {HOME_FAQ.map((entry) => (
                <details
                  key={entry.question}
                  className="group border-line border-t"
                >
                  <summary
                    className={`flex cursor-pointer list-none items-baseline gap-3 py-4 font-medium ${focusRing}`}
                  >
                    <span
                      aria-hidden="true"
                      className="text-paper-dim transition-transform group-open:rotate-90 motion-reduce:transition-none"
                    >
                      &gt;
                    </span>
                    {entry.question}
                  </summary>
                  <p className="text-paper-dim border-line-strong mb-5 ml-1.5 border-l pl-5 leading-relaxed">
                    <FaqAnswer parts={entry.answer} />
                  </p>
                </details>
              ))}
            </div>
          </section>

          <section
            aria-labelledby="cta-heading"
            className="border-line-strong bg-ink-raised mb-16 flex flex-col items-start gap-6 border px-6 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-10"
          >
            <p id="cta-heading" className="text-heading max-w-md font-semibold">
              Load an image. Pick an algorithm.{" "}
              <span className="text-paper-dim">Export.</span>
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/editor">Open the editor</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href={SAMPLE_LINK}>Try the sample</Link>
              </Button>
            </div>
          </section>
        </main>

        <SiteFooter />
      </div>
    </div>
  );
}

function SectionHead({
  id,
  title,
  link,
  children,
}: {
  id: string;
  title: string;
  link?: { label: string; href: string };
  children: React.ReactNode;
}) {
  return (
    <div className="mb-10 flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
      <div className="flex max-w-4xl flex-col gap-4">
        <h2 id={id} className="font-display text-glow text-title font-normal">
          {title}
        </h2>
        <p className="text-paper-dim max-w-2xl text-lg leading-relaxed">
          {children}
        </p>
      </div>
      {link && (
        <Link href={link.href} className={`${textLink} text-sm`}>
          {link.label}
        </Link>
      )}
    </div>
  );
}

/** Up to this many colors, a cartridge lists every hex value as text. */
const HEX_LIST_MAX = 8;

function PaletteCartridge({ id }: { id: string }) {
  const palette = getPalettePreset(id);
  if (!palette) return null;
  const titleId = `cartridge-${id}`;
  const { colors } = palette;

  return (
    <li className="group border-line-strong bg-ink-raised hover:border-paper relative flex flex-col border transition-colors">
      <div aria-hidden="true" className="flex h-10">
        {colors.map((color, index) => (
          <span
            key={index}
            className="flex-1"
            style={{ backgroundColor: color }}
          />
        ))}
      </div>
      <div className="border-line flex flex-1 flex-col gap-2 border-t p-3">
        <div className="flex items-baseline justify-between gap-2">
          <h4 id={titleId} className="text-sm font-semibold">
            {/* Stretched over the whole cartridge. */}
            <Link
              href={`/palettes#palette-${id}`}
              className={`group-hover:text-paper-hot after:absolute after:inset-0 ${focusRing}`}
            >
              {palette.name}
            </Link>
          </h4>
          <span className="text-caps text-paper-dim shrink-0">
            {colors.length} colors
          </span>
        </div>
        {colors.length <= HEX_LIST_MAX ? (
          <p className="text-readout text-paper-dim uppercase">
            {colors.join(" ")}
          </p>
        ) : (
          <p className="text-readout text-paper-dim">
            Matches by {palette.match}
          </p>
        )}
      </div>
    </li>
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
