import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FaqList, RichText, textLink } from "@/components/faq-list";
import {
  PaletteVariants,
  VariantCompare,
  VariantEditorButton,
  VariantImage,
  VariantName,
  VariantPicker,
} from "@/components/palette-variants";
import { GlobalHeader } from "@/components/global-header";
import { SiteFooter } from "@/components/site-footer";
import { StructuredData } from "@/components/structured-data";
import { Button } from "@/components/ui/button";
import { getAlgorithm } from "@/lib/algorithms";
import { hexToRgb } from "@/lib/editor/pixels";
import { faqStructuredData } from "@/lib/faq";
import {
  getPaletteGuide,
  gplFile,
  hexFile,
  guidePresets,
  PALETTE_GUIDES,
  paletteGuideTitle,
  type PaletteGuide,
} from "@/lib/palette-guides";
import type { PalettePreset } from "@/lib/palettes";
import {
  HERO_ORIGINAL,
  HERO_SIZE,
  heroVariant,
  PALETTE_PREVIEW_ALGORITHM,
  PALETTE_PREVIEW_SIZE,
  palettePreview,
} from "@/lib/samples";
import {
  absoluteUrl,
  breadcrumbStructuredData,
  pageMetadata,
  siteConfig,
} from "@/lib/site";

type Params = { slug: string };

export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  return PALETTE_GUIDES.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const guide = getPaletteGuide((await params).slug);
  if (!guide) return {};
  return pageMetadata({
    title: paletteGuideTitle(guide),
    description: guide.description,
    path: `/palettes/${guide.slug}`,
  });
}

/** A value for each preset a page shows, keyed by preset id. */
function perPreset<T>(
  presets: { preset: PalettePreset }[],
  value: (preset: PalettePreset) => T,
): Record<string, T> {
  return Object.fromEntries(
    presets.map(({ preset }) => [preset.id, value(preset)]),
  );
}

const MATCH_LABEL = { color: "By color", brightness: "By brightness" };

export default async function PaletteGuidePage({
  params,
}: {
  params: Promise<Params>;
}) {
  const guide = getPaletteGuide((await params).slug);
  if (!guide) notFound();

  const presets = guidePresets(guide);
  const main = presets[0].preset;
  const path = `/palettes/${guide.slug}`;
  const heading = `${guide.name} Palette`;
  const previewAlgorithm = getAlgorithm(PALETTE_PREVIEW_ALGORITHM)!;

  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "TechArticle",
      headline: heading,
      description: guide.description,
      url: absoluteUrl(path),
      image: absoluteUrl(palettePreview(main.id)),
      inLanguage: "en",
      about: { "@type": "Thing", name: `${guide.name} color palette` },
      isPartOf: {
        "@type": "CollectionPage",
        name: "Color palettes",
        url: absoluteUrl("/palettes"),
      },
      publisher: {
        "@type": "Person",
        name: siteConfig.creator,
        url: siteConfig.links.github,
      },
    },
    breadcrumbStructuredData([
      { name: "Palettes", path: "/palettes" },
      { name: guide.name, path },
    ]),
    faqStructuredData(guide.faq),
  ];

  return (
    <>
      <StructuredData data={structuredData} />
      <GlobalHeader
        page={guide.name}
        parent={{ label: "Palettes", href: "/palettes" }}
      />

      <PaletteVariants
        variants={presets.map(({ preset }) => ({
          id: preset.id,
          name: preset.name,
        }))}
      >
        <article className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-4 py-10 sm:px-8">
          {/* 480 px preview + 12 px padding + 1 px border on each side: 1:1. */}
          <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,31.625rem)_1fr] lg:gap-14">
            <div className="flex flex-col gap-3">
              <VariantPicker label="Palette shown" />
              <figure className="border-line-strong bg-ink-sunken border p-3">
                <VariantCompare
                  before={{
                    src: HERO_ORIGINAL.src,
                    alt: "The sample image before dithering: a synthwave sunset, a striped sun over mountains and a neon grid",
                  }}
                  after={perPreset(presets, (preset) => ({
                    src: palettePreview(preset.id),
                    alt: `The same sunset dithered to the ${preset.name} palette with ${previewAlgorithm.name}`,
                  }))}
                  width={PALETTE_PREVIEW_SIZE.width}
                  height={PALETTE_PREVIEW_SIZE.height}
                  beforeSizes={`(max-width: 640px) 100vw, ${PALETTE_PREVIEW_SIZE.width}px`}
                  afterClassName="max-sm:image-smooth"
                />
                <figcaption className="text-readout text-paper-dim mt-2">
                  {previewAlgorithm.shortName} · <VariantName /> ·{" "}
                  {PALETTE_PREVIEW_SIZE.width} × {PALETTE_PREVIEW_SIZE.height}{" "}
                  px
                </figcaption>
              </figure>
            </div>

            <div className="flex flex-col">
              <p className="text-paper-dim text-sm">{main.group}</p>
              <h1
                tabIndex={-1}
                className="font-display text-glow text-title mt-3 font-normal focus:outline-hidden"
              >
                {heading}
              </h1>
              <p className="text-paper-dim mt-5 max-w-prose text-lg leading-relaxed">
                {guide.intro}
              </p>

              <dl className="border-line mt-8 grid grid-cols-2 gap-x-6 gap-y-4 border-t pt-6 text-sm sm:grid-cols-4">
                <Meta label="Colors">
                  <span className="text-readout">{main.colors.length}</span>
                </Meta>
                <Meta label="Year">
                  <span className="text-readout">{guide.facts.year}</span>
                </Meta>
                <Meta label="Hardware">{guide.facts.hardware}</Meta>
                <Meta label="Match">{MATCH_LABEL[main.match]}</Meta>
              </dl>

              <div className="mt-8 flex flex-wrap gap-3">
                <VariantEditorButton verb="Use" />
                <Button asChild size="lg" variant="outline">
                  <Link href="/palettes">All palettes</Link>
                </Button>
              </div>
            </div>
          </div>

          <section
            aria-labelledby="colors-heading"
            className="flex flex-col gap-8"
          >
            <div className="max-w-prose">
              <h2 id="colors-heading" className="text-heading font-semibold">
                {presets.length > 1
                  ? `The ${guide.name} colors`
                  : `The ${main.colors.length} ${guide.name} colors`}
              </h2>
              <p className="text-paper-dim mt-2 leading-relaxed">
                {guide.accuracy}
              </p>
            </div>
            {presets.map((entry) => (
              <ColorTable
                key={entry.id}
                preset={entry.preset}
                heading={entry.heading}
                names={entry.names}
                headingId={`colors-${entry.id}`}
              />
            ))}
          </section>

          {guide.sections.map((section, index) => (
            <section
              key={section.heading}
              aria-labelledby={`section-${index}`}
              className="flex max-w-prose flex-col gap-4"
            >
              <h2
                id={`section-${index}`}
                className="text-heading font-semibold"
              >
                {section.heading}
              </h2>
              {section.paragraphs.map((paragraph, p) => (
                <p key={p} className="text-paper-dim leading-relaxed">
                  <RichText parts={paragraph} />
                </p>
              ))}
            </section>
          ))}

          <section aria-labelledby="steps-heading" className="max-w-prose">
            <h2 id="steps-heading" className="text-heading font-semibold">
              How to make {guide.name}-style images
            </h2>
            <ol className="text-paper-dim mt-4 flex list-decimal flex-col gap-3 pl-5 leading-relaxed">
              {guide.steps.map((step, index) => (
                <li key={index}>
                  <RichText parts={step} />
                </li>
              ))}
            </ol>
          </section>

          <section
            aria-labelledby="examples-heading"
            className="flex flex-col gap-6"
          >
            <div className="max-w-prose">
              <h2 id="examples-heading" className="text-heading font-semibold">
                The {guide.name} palette with different dithers
              </h2>
              <p className="text-paper-dim mt-2 leading-relaxed">
                The same sunset at {HERO_SIZE.width} × {HERO_SIZE.height}{" "}
                pixels, shown at actual size.
              </p>
            </div>
            <VariantPicker
              label="Palette shown in the examples"
              className="sm:max-w-md"
            />
            <ul className="grid gap-6 lg:grid-cols-2">
              {guide.examples.map((slug) => {
                const algorithm = getAlgorithm(slug)!;
                return (
                  <li key={slug}>
                    <figure className="flex flex-col gap-2">
                      <VariantImage
                        image={perPreset(presets, (preset) => ({
                          src: heroVariant(slug, preset.id),
                          alt: `The sample sunset dithered to the ${preset.name} palette with ${algorithm.name}`,
                        }))}
                        width={HERO_SIZE.width}
                        height={HERO_SIZE.height}
                        unoptimized
                        // 1:1 from sm up; smaller screens scale it down
                        // smoothly (nearest-neighbor would add moiré).
                        className="border-line-strong bg-ink-sunken pixelated max-sm:image-smooth h-auto max-w-full border"
                      />
                      <figcaption className="text-sm">
                        <Link href={`/algorithms/${slug}`} className={textLink}>
                          {algorithm.shortName}
                        </Link>
                      </figcaption>
                    </figure>
                  </li>
                );
              })}
            </ul>
          </section>

          <section aria-labelledby="try-heading" className="max-w-prose">
            <h2 id="try-heading" className="text-heading font-semibold">
              Try the {guide.name} palette on your image
            </h2>
            <p className="text-paper-dim mt-2 leading-relaxed">
              Open the editor with <VariantName /> already selected, drop in a
              photo or an animated GIF, pick a dithering algorithm and export a
              PNG. Free, no account, no watermark, and your image never leaves
              your device.
            </p>
            <VariantEditorButton verb="Open" className="mt-6" />
          </section>

          <section aria-labelledby="faq-heading">
            <h2 id="faq-heading" className="text-heading mb-4 font-semibold">
              {guide.name} palette FAQ
            </h2>
            <FaqList faq={guide.faq} />
          </section>

          <nav
            aria-labelledby="related-heading"
            className="border-line flex flex-col gap-4 border-t pt-8"
          >
            <h2 id="related-heading" className="text-caps text-paper-dim">
              Related palettes
            </h2>
            <ul className="grid gap-4 sm:grid-cols-3">
              {guide.related.map((slug) => (
                <RelatedLink key={slug} guide={getPaletteGuide(slug)!} />
              ))}
            </ul>
            <Link href="/palettes" className={`${textLink} self-start text-sm`}>
              All color palettes
            </Link>
          </nav>
        </article>
      </PaletteVariants>
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-8">
        <SiteFooter />
      </div>
    </>
  );
}

function ColorTable({
  preset,
  heading,
  names,
  headingId,
}: {
  preset: PalettePreset;
  heading?: string;
  names?: readonly string[];
  headingId: string;
}) {
  const colors = preset.colors.map((hex) => ({
    hex: hex.toUpperCase(),
    rgb: hexToRgb(hex),
  }));
  const label = heading ?? `${preset.name} colors`;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        {heading ? (
          <h3 id={headingId} className="font-semibold">
            {heading}
          </h3>
        ) : (
          <span id={headingId} className="sr-only">
            {label}
          </span>
        )}
        <p className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
          <span className="text-paper-dim">Download:</span>
          <a
            href={dataUri(hexFile(preset))}
            download={`${preset.id}.hex`}
            className={textLink}
          >
            HEX<span className="sr-only"> file of {preset.name}</span>
          </a>
          <a
            href={dataUri(gplFile(preset, names))}
            download={`${preset.id}.gpl`}
            className={textLink}
          >
            GPL<span className="sr-only"> file of {preset.name}</span>
          </a>
        </p>
      </div>

      {names ? (
        <div className="overflow-hidden">
          <table
            aria-labelledby={headingId}
            className="border-line w-full border-collapse border text-left text-sm"
          >
            <thead>
              <tr className="border-line border-b">
                <th scope="col" className="px-3 py-2">
                  <span className="sr-only">Swatch</span>
                </th>
                {["Name", "Hex", "RGB"].map((col) => (
                  <th
                    key={col}
                    scope="col"
                    className={`text-caps text-paper-dim px-3 py-2 font-normal ${col === "RGB" ? "max-sm:hidden" : ""}`}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {colors.map((color, index) => (
                <tr key={index} className="border-line border-b">
                  <td className="w-12 px-3 py-2">
                    <span
                      aria-hidden="true"
                      className="inset-ring-line-strong block size-6 inset-ring"
                      style={{ background: color.hex }}
                    />
                  </td>
                  <th scope="row" className="px-3 py-2 font-normal">
                    {names[index]}
                  </th>
                  <td className="text-readout px-3 py-2">{color.hex}</td>
                  <td className="text-readout text-paper-dim px-3 py-2 max-sm:hidden">
                    {color.rgb.join(", ")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <ul
          aria-labelledby={headingId}
          className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6"
        >
          {colors.map((color, index) => (
            <li
              key={index}
              className="border-line flex items-center gap-3 border p-2"
            >
              <span
                aria-hidden="true"
                className="inset-ring-line-strong size-6 shrink-0 inset-ring"
                style={{ background: color.hex }}
              />
              <span className="text-readout">{color.hex}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function RelatedLink({ guide }: { guide: PaletteGuide }) {
  const [{ preset }] = guidePresets(guide);
  return (
    <li>
      <Link
        href={`/palettes/${guide.slug}`}
        className="group border-line hover:border-line-strong focus-visible:ring-safelight flex h-full flex-col gap-3 border p-4 transition-colors focus-visible:ring-2 focus-visible:outline-none"
      >
        <span className="group-hover:text-paper-hot text-lg font-semibold transition-colors">
          {guide.name}
        </span>
        <span aria-hidden="true" className="flex h-3">
          {preset.colors.map((color, index) => (
            <span
              key={index}
              className="flex-1"
              style={{ background: color }}
            />
          ))}
        </span>
        <span className="text-readout text-paper-dim">
          {preset.colors.length} colors
        </span>
      </Link>
    </li>
  );
}

function Meta({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-label text-paper-dim">{label}</dt>
      <dd className="text-paper mt-1">{children}</dd>
    </div>
  );
}

const dataUri = (text: string) =>
  `data:text/plain;charset=utf-8,${encodeURIComponent(text)}`;
