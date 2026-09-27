import Image from "next/image";
import Link from "next/link";
import { AnimatedGifDemo } from "@/components/landing/animated-gif-demo";
import {
  HeroInstrument,
  type HeroAlgorithmInfo,
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
  getCategory,
  PREVIEW_SIZE,
  type AlgorithmCategory,
  type AlgorithmId,
} from "@/lib/algorithms";
import { MAX_ANIMATION_FRAMES } from "@/lib/editor/animation-limits";
import { EXPORT_FACTORS } from "@/lib/editor/export";
import { SUPPORTED_IMAGE_TYPES } from "@/lib/editor/load-image";
import extractedColors from "@/data/sample-extracted-palette.json";
import { faqStructuredData, HOME_FAQ, type FaqPart } from "@/lib/home-faq";
import {
  getPalettePreset,
  MAX_PALETTE_COLORS,
  MIN_PALETTE_COLORS,
  PALETTE_PRESETS,
} from "@/lib/palettes";
import {
  ANIMATED_DITHER,
  ANIMATED_SAMPLE,
  HERO_ALGORITHMS,
  HERO_ORIGINAL,
  HERO_PALETTES,
  HERO_VARIANT_PATTERN,
  HERO_SIZE,
  heroVariant,
  PIXEL_ART_PREVIEW,
  SAMPLE_IMAGE,
} from "@/lib/samples";
import { absoluteUrl, siteConfig } from "@/lib/site";

const SAMPLE_LINK = "/editor?sample=1";
const ANIMATED_SAMPLE_LINK = "/editor?sample=animated";
const PIXEL_ART_LINK = "/editor?preset=pixel-art";

const paletteName = (id: string) => getPalettePreset(id)?.name ?? id;
const algorithmName = (slug: string) => getAlgorithm(slug)?.shortName ?? slug;

const HERO_ALGORITHM_LIST: HeroAlgorithmInfo[] = HERO_ALGORITHMS.map((id) => ({
  id,
  name: algorithmName(id),
}));

const HERO_PALETTE_LIST = HERO_PALETTES.map((id): HeroPaletteInfo => {
  const preset = getPalettePreset(id);
  return preset
    ? { id, name: preset.name, colors: preset.colors.length, param: id }
    : { id, name: "1-bit", colors: 2, param: null };
});

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
    screenshot: absoluteUrl(heroVariant("floyd-steinberg", "1-bit")),
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
            <Link href="/editor" className={navLink}>
              Editor
            </Link>
            <Link href="/algorithms" className={navLink}>
              Algorithms
            </Link>
            <Link href="/palettes" className={navLink}>
              Palettes
            </Link>
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
          <section className="grid items-center gap-12 pt-12 pb-16 lg:pt-20 lg:pb-20 xl:grid-cols-2">
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
              variantPattern={HERO_VARIANT_PATTERN}
              size={HERO_SIZE}
              original={HERO_ORIGINAL}
            />
          </section>

          <section aria-label="Specifications" className="pb-20">
            {/* Cells on a 1 px gap over the line color: one hairline between
                cells at every column count, none doubled against the frame. */}
            <dl className="border-line-strong bg-line grid grid-cols-2 gap-px border sm:grid-cols-3 lg:grid-cols-6">
              {SPECS.map((spec) => (
                <div
                  key={spec.label}
                  className="bg-ink-raised flex flex-col gap-2 p-4"
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
              title={`${ALGORITHMS.length} dithering algorithms, four families`}
              link={{
                label: `Compare all ${ALGORITHMS.length}`,
                href: "/algorithms",
              }}
            >
              The same terminal through one algorithm from each family. Every
              algorithm has its own page with a before and after.
            </SectionHead>
            <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {ALGORITHM_CATEGORIES.map((category) => (
                <FamilyCard key={category.id} category={category.id} />
              ))}
            </ul>
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
            <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {FEATURED_PALETTES.map((id) => {
                const palette = getPalettePreset(id);
                return (
                  palette && (
                    <Cartridge
                      key={id}
                      name={palette.name}
                      href={`/palettes#palette-${id}`}
                      colors={palette.colors}
                      detail={`Matches by ${palette.match}`}
                    />
                  )
                );
              })}
              <Cartridge
                name="Your colors"
                href="/palettes#group-dynamic"
                colors={extractedColors}
                count={`${MIN_PALETTE_COLORS}–${MAX_PALETTE_COLORS} colors`}
                detail="From your image or by hand"
              />
            </ul>
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
                The pixel art preset shrinks any image to about 128 × 96 pixels’
                worth of detail, whatever its shape, snaps it to PICO-8 with a
                2×2 Bayer pattern and exports crisp at ×4 or ×8. For sprites and
                game assets, save at ×1: dithered images export as indexed PNGs.
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
                the original. Ordered patterns like{" "}
                <Link href="/algorithms/bayer-8-8" className={textLink}>
                  Bayer
                </Link>{" "}
                and{" "}
                <Link href="/algorithms/blue-noise" className={textLink}>
                  Blue Noise
                </Link>{" "}
                stay put between frames, so the animation doesn’t shimmer.
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
              alt={`The animated sample, a neon grid rolling toward a striped sun, dithered with ${algorithmName(ANIMATED_DITHER.algorithm)} and the ${paletteName(ANIMATED_DITHER.palette)} palette`}
              caption={`${ANIMATED_SAMPLE.frames} frames · ${ANIMATED_SAMPLE.delay} ms · ${algorithmName(ANIMATED_DITHER.algorithm)} · ${paletteName(ANIMATED_DITHER.palette)}`}
            />
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

/** The algorithm that stands for each family on the landing. */
const FAMILY_LEADS: Record<AlgorithmCategory, AlgorithmId> = {
  "error-diffusion": "floyd-steinberg",
  ordered: "bayer-8-8",
  noise: "void-and-cluster",
  screen: "halftone",
};

function FamilyCard({ category }: { category: AlgorithmCategory }) {
  const family = getCategory(category);
  const members = ALGORITHMS.filter(
    (algorithm) => algorithm.category === category,
  );
  const lead = getAlgorithm(FAMILY_LEADS[category]);
  if (!family || !lead) return null;
  const others = members.filter((algorithm) => algorithm.slug !== lead.slug);

  return (
    <li className="group border-line-strong bg-ink-raised hover:border-paper relative flex flex-col border transition-colors">
      <h3 className="text-caps text-paper border-line truncate border-b px-4 py-3">
        {family.name}
      </h3>
      {/* Neutral well. The card is narrower than the 400 px preview, so it is
          scaled down smoothly (nearest-neighbor would add moiré). */}
      <div className="bg-ink-sunken border-line border-b">
        <Image
          src={lead.preview}
          alt={`A CRT terminal on a checkered table, dithered with ${lead.name}`}
          width={PREVIEW_SIZE}
          height={PREVIEW_SIZE}
          unoptimized
          className="w-full"
        />
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex flex-col gap-1">
          {/* Stretched over the whole card. */}
          <Link
            href={`/algorithms/${lead.slug}`}
            className={`text-heading group-hover:text-paper-hot font-semibold after:absolute after:inset-0 ${focusRing}`}
          >
            {lead.shortName}
          </Link>
          <p className="text-readout text-paper-dim">
            {[lead.author, lead.year].filter(Boolean).join(" · ")}
          </p>
        </div>
        <div className="border-line mt-auto border-t pt-3">
          <Link
            href={`/algorithms#family-${category}`}
            className={`${textLink} relative z-10 text-sm`}
          >
            +{others.length} more
            <span className="sr-only">
              {" "}
              {family.name.toLowerCase()}{" "}
              {others.length === 1 ? "algorithm" : "algorithms"}
            </span>
          </Link>
        </div>
      </div>
    </li>
  );
}

/** The best-known palettes; the title names the first four. */
const FEATURED_PALETTES = [
  "gameboy",
  "nes",
  "pico8",
  "cga-cyan-magenta",
  "c64",
  "riso",
  "cyanotype",
];

function Cartridge({
  name,
  href,
  colors,
  count = `${colors.length} colors`,
  detail,
}: {
  name: string;
  href: string;
  colors: readonly string[];
  count?: string;
  detail: string;
}) {
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
          <h3 className="min-w-0 truncate text-sm font-semibold">
            {/* Stretched over the whole cartridge. */}
            <Link
              href={href}
              className={`group-hover:text-paper-hot after:absolute after:inset-0 ${focusRing}`}
            >
              {name}
            </Link>
          </h3>
          <span className="text-caps text-paper-dim shrink-0">{count}</span>
        </div>
        <p className="text-readout text-paper-dim truncate">{detail}</p>
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
