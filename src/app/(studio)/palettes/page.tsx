import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { GlobalHeader } from "@/components/global-header";
import { SiteFooter } from "@/components/site-footer";
import { cn } from "@/lib/utils";
import { StructuredData } from "@/components/structured-data";
import { Button } from "@/components/ui/button";
import extractedColors from "@/data/sample-extracted-palette.json";
import { guideForPalette, paletteHref } from "@/lib/palette-guides";
import {
  MAX_PALETTE_COLORS,
  MIN_PALETTE_COLORS,
  PALETTE_GROUPS,
  PALETTE_PRESETS,
  type PaletteGroup,
  type PaletteMatch,
} from "@/lib/palettes";
import {
  EXTRACTED_PREVIEW_COLORS,
  PALETTE_PREVIEW_SIZE,
  palettePreview,
  PIXEL_ART_PREVIEW,
} from "@/lib/samples";
import {
  absoluteUrl,
  breadcrumbStructuredData,
  pageMetadata,
  siteConfig,
} from "@/lib/site";

const description = `Dither images to ${PALETTE_PRESETS.length} retro color palettes, with every hex value: Game Boy, NES, PICO-8, CGA, ZX Spectrum, Commodore 64, riso, cyanotype or your own colors.`;

export const metadata: Metadata = pageMetadata({
  title: "Retro Color Palettes: Game Boy, NES, PICO-8",
  description,
  path: "/palettes",
});

const GROUP_NOTES: Record<Exclude<PaletteGroup, "Dynamic">, string> = {
  "Consoles & computers":
    "Hardware palettes, with hex values from each system’s reference.",
  "Print & photo":
    "Inks, papers and photographic processes. They follow a tone ramp, so they match by brightness.",
  PixelSynth: "The colors of this site.",
};

const MATCH_LABEL: Record<PaletteMatch, string> = {
  color: "Matches by color",
  brightness: "Matches by brightness",
};

const structuredData = [
  {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `Retro Color Palettes | ${siteConfig.name}`,
    url: absoluteUrl("/palettes"),
    description,
    inLanguage: "en",
    isPartOf: {
      "@type": "WebSite",
      name: siteConfig.name,
      url: siteConfig.url,
    },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: PALETTE_PRESETS.length,
      itemListElement: PALETTE_PRESETS.map((palette, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: absoluteUrl(paletteHref(palette.id)),
        name: palette.name,
        description: palette.description,
        image: absoluteUrl(palettePreview(palette.id)),
      })),
    },
  },
  breadcrumbStructuredData([{ name: "Palettes", path: "/palettes" }]),
];

export default function PalettesPage() {
  const groups = PALETTE_GROUPS.filter(
    (group): group is Exclude<PaletteGroup, "Dynamic"> => group !== "Dynamic",
  );

  return (
    <>
      <StructuredData data={structuredData} />
      <GlobalHeader page="Palettes" />
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-14 px-4 py-10 sm:px-8">
        <header className="border-line flex flex-col gap-6 border-b pb-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <h1
              tabIndex={-1}
              className="font-display text-glow text-title font-normal focus:outline-hidden"
            >
              Color palettes
            </h1>
            <Button asChild variant="outline">
              <Link href="/editor">Open editor</Link>
            </Button>
          </div>
          <p className="text-paper-dim max-w-2xl text-lg leading-relaxed">
            Dither straight to a fixed set of colors. Every preview below is the
            same sample image, rendered by the editor’s own engine with
            Floyd–Steinberg: a synthwave sunset with a long sky gradient, a
            striped sun and a neon grid.
          </p>
          <nav aria-label="Palette groups">
            <ul className="flex flex-wrap gap-2">
              {[...groups, "Dynamic" as const].map((group) => (
                <li key={group}>
                  <a
                    href={`#group-${slug(group)}`}
                    className="border-line-strong text-paper-dim hover:text-paper hover:border-paper focus-visible:ring-safelight inline-flex h-9 items-center border px-3.5 text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none"
                  >
                    {group === "Dynamic" ? "Your own colors" : group}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </header>

        <section
          aria-labelledby="pixel-art-heading"
          className="grid items-center gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]"
        >
          <figure className="border-line-strong bg-ink-sunken border p-3">
            <Image
              src={PIXEL_ART_PREVIEW.src}
              alt={`The sample image at ${PIXEL_ART_PREVIEW.width} by ${PIXEL_ART_PREVIEW.height} pixels, PICO-8 palette, 2×2 Bayer pattern`}
              width={PIXEL_ART_PREVIEW.width}
              height={PIXEL_ART_PREVIEW.height}
              unoptimized
              priority
              className="w-full [image-rendering:pixelated]"
            />
            <figcaption className="text-readout text-paper-dim mt-2">
              {PIXEL_ART_PREVIEW.width} × {PIXEL_ART_PREVIEW.height} px, shown
              enlarged
            </figcaption>
          </figure>
          <div className="flex flex-col gap-4">
            <h2 id="pixel-art-heading" className="text-heading font-semibold">
              Pixel art in one click
            </h2>
            <p className="text-paper-dim leading-relaxed">
              The editor’s{" "}
              <strong className="text-paper font-medium">
                Pixel art preset
              </strong>{" "}
              shrinks any image to about 128 × 96 pixels’ worth of detail,
              whatever its shape, and applies PICO-8 with a 2×2 Bayer pattern.
              Save it at ×4 or ×8 and every pixel stays a crisp block.
            </p>
            <Button asChild className="self-start">
              <Link href="/editor?preset=pixel-art">
                Try the pixel art preset
              </Link>
            </Button>
          </div>
        </section>

        {groups.map((group) => (
          <section
            key={group}
            id={`group-${slug(group)}`}
            aria-labelledby={`group-${slug(group)}-heading`}
            className="flex scroll-mt-20 flex-col gap-6"
          >
            <div className="flex max-w-3xl flex-col gap-2">
              <h2
                id={`group-${slug(group)}-heading`}
                className="text-heading font-semibold"
              >
                {group}
              </h2>
              <p className="text-paper-dim leading-relaxed">
                {GROUP_NOTES[group]}
              </p>
            </div>
            <ul className="grid gap-5 sm:grid-cols-2">
              {PALETTE_PRESETS.filter((p) => p.group === group).map(
                (palette, index, list) => {
                  // A last card left alone in its row spans both columns.
                  const wide =
                    list.length % 2 === 1 && index === list.length - 1;
                  return (
                    <li
                      key={palette.id}
                      className={wide ? "sm:col-span-2" : undefined}
                    >
                      <PaletteCard
                        id={palette.id}
                        name={palette.name}
                        description={palette.description}
                        colors={palette.colors}
                        match={palette.match}
                        wide={wide}
                      />
                    </li>
                  );
                },
              )}
            </ul>
          </section>
        ))}

        <section
          id="group-dynamic"
          aria-labelledby="group-dynamic-heading"
          className="flex scroll-mt-20 flex-col gap-6"
        >
          <div className="flex max-w-3xl flex-col gap-2">
            <h2
              id="group-dynamic-heading"
              className="text-heading font-semibold"
            >
              Your own colors
            </h2>
            <p className="text-paper-dim leading-relaxed">
              Two palettes that aren’t fixed: one is taken from the image you
              load, the other is yours to build.
            </p>
          </div>
          <ul className="grid gap-5 sm:grid-cols-2">
            <li>
              <PaletteCard
                id="extracted"
                name="From image"
                description={`Picks the ${EXTRACTED_PREVIEW_COLORS} most representative colors of your image (${MIN_PALETTE_COLORS} to ${MAX_PALETTE_COLORS}, median cut). These are the ones found in the sample.`}
                colors={extractedColors}
                match="color"
              />
            </li>
            <li>
              <article
                id="palette-custom"
                aria-labelledby="palette-custom-title"
                className="border-line bg-ink-raised flex h-full scroll-mt-20 flex-col gap-3 border p-5"
              >
                <h3
                  id="palette-custom-title"
                  className="text-heading font-semibold"
                >
                  Custom
                </h3>
                <p className="text-paper-dim text-sm leading-relaxed">
                  Build a palette of {MIN_PALETTE_COLORS} to{" "}
                  {MAX_PALETTE_COLORS} colors with the color picker, start from
                  any palette above with “Edit colors”, or import one from
                  Lospec: paste its hex codes or open its HEX, GPL, PAL or TXT
                  file. It is saved in your browser. Use it for brand colors or
                  for systems not listed here.
                </p>
                <Link
                  href="/editor?palette=custom"
                  className="text-paper hover:text-paper-hot hover:decoration-paper-hot focus-visible:ring-safelight decoration-line-strong mt-auto self-start text-sm font-medium underline underline-offset-4 transition-colors focus-visible:ring-2 focus-visible:outline-none"
                >
                  Build one in the editor
                </Link>
              </article>
            </li>
          </ul>
        </section>
      </div>
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-8">
        <SiteFooter />
      </div>
    </>
  );
}

function PaletteCard({
  id,
  name,
  description,
  colors,
  match,
  wide = false,
}: {
  id: string;
  name: string;
  description: string;
  colors: readonly string[];
  match: PaletteMatch;
  /** Image beside the text, for a card spanning both columns. */
  wide?: boolean;
}) {
  const titleId = `palette-${id}-title`;
  const guide = guideForPalette(id);
  return (
    <article
      id={`palette-${id}`}
      aria-labelledby={titleId}
      // With a guide page, the title link is stretched over the whole card
      // (as on algorithm cards); the editor link sits above it (z-10) and
      // stays independently clickable.
      className={cn(
        "border-line-strong bg-ink-raised target:border-safelight flex h-full scroll-mt-20 flex-col overflow-hidden border",
        guide && "group hover:border-paper relative transition-colors",
        wide && "sm:flex-row",
      )}
    >
      <Image
        src={palettePreview(id)}
        alt={`The sample image dithered with the ${name} palette`}
        width={PALETTE_PREVIEW_SIZE.width}
        height={PALETTE_PREVIEW_SIZE.height}
        unoptimized
        className={cn(
          "border-line bg-ink-sunken w-full border-b sm:[image-rendering:pixelated]",
          wide &&
            "sm:w-1/2 sm:shrink-0 sm:self-start sm:border-r sm:border-b-0",
        )}
      />
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-baseline justify-between gap-3">
          <h3 id={titleId} className="text-heading font-semibold">
            {guide ? (
              <Link
                href={`/palettes/${guide.slug}`}
                className="group-hover:text-paper-hot focus-visible:after:ring-safelight transition-colors after:absolute after:inset-0 after:content-[''] focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-inset"
              >
                {name}
              </Link>
            ) : (
              name
            )}
          </h3>
          <span className="text-readout text-paper-dim shrink-0">
            {colors.length} colors
          </span>
        </div>
        <p className="text-paper-dim flex-1 text-sm leading-relaxed">
          {description}
        </p>
        <ul className="flex flex-wrap gap-1" aria-label={`${name} colors`}>
          {colors.map((color, index) => (
            <li
              key={`${color}-${index}`}
              title={color}
              className="size-6 shadow-[inset_0_0_0_1px_var(--line-strong)]"
              style={{ background: color }}
            >
              <span className="sr-only">{color}</span>
            </li>
          ))}
        </ul>
        <div className="border-line flex flex-wrap items-center justify-between gap-3 border-t pt-3">
          <span className="text-label text-paper-dim">
            {MATCH_LABEL[match]}
          </span>
          <Link
            href={`/editor?palette=${id}`}
            className="text-paper hover:text-paper-hot hover:decoration-paper-hot focus-visible:ring-safelight decoration-line-strong relative z-10 text-sm font-medium underline underline-offset-4 transition-colors focus-visible:ring-2 focus-visible:outline-none"
          >
            Use in the editor
            <span className="sr-only">: {name}</span>
          </Link>
        </div>
      </div>
    </article>
  );
}

function slug(group: string) {
  return group.toLowerCase().replace(/[^a-z]+/g, "-");
}
