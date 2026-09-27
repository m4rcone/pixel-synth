import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Image from "next/image";
import {
  AlgorithmMethod,
  AlgorithmPseudocode,
} from "@/components/algorithm-method";
import { CompareSlider } from "@/components/compare-slider";
import { FaqList, RichText, textLink } from "@/components/faq-list";
import { GlobalHeader } from "@/components/global-header";
import { SiteFooter } from "@/components/site-footer";
import { StructuredData } from "@/components/structured-data";
import { Button } from "@/components/ui/button";
import {
  ALGORITHMS,
  ditheringName,
  getAlgorithm,
  getCategory,
  PREVIEW_SIZE,
  PREVIEW_SOURCE,
  type Algorithm,
  type AlgorithmId,
} from "@/lib/algorithms";
import { getGuide, guideTitle } from "@/lib/algorithm-guides";
import { getMethod } from "@/lib/editor/dither";
import { faqStructuredData } from "@/lib/faq";
import {
  absoluteUrl,
  breadcrumbStructuredData,
  pageMetadata,
  siteConfig,
} from "@/lib/site";

type Params = { slug: string };

export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  return ALGORITHMS.map(({ slug }) => ({ slug }));
}

/** "Atkinson Dithering", "Random Dithering". */
const heading = (algorithm: Algorithm) =>
  `${ditheringName(algorithm)} Dithering`;

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const algorithm = getAlgorithm((await params).slug);
  if (!algorithm) return {};
  return pageMetadata({
    title: guideTitle(algorithm),
    description: getGuide(algorithm).description,
    path: `/algorithms/${algorithm.slug}`,
  });
}

export default async function AlgorithmPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const algorithm = getAlgorithm((await params).slug);
  if (!algorithm) notFound();

  const index = ALGORITHMS.findIndex((a) => a.slug === algorithm.slug);
  const previous = ALGORITHMS[index - 1];
  const next = ALGORITHMS[index + 1];
  const category = getCategory(algorithm.category);
  const path = `/algorithms/${algorithm.slug}`;
  const guide = getGuide(algorithm);

  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "TechArticle",
      headline: heading(algorithm),
      description: guide.description,
      url: absoluteUrl(path),
      image: absoluteUrl(algorithm.preview),
      inLanguage: "en",
      about: {
        "@type": "Thing",
        name: algorithm.name,
        ...(algorithm.author ? { creator: algorithm.author } : {}),
      },
      isPartOf: {
        "@type": "CollectionPage",
        name: "Dithering algorithms",
        url: absoluteUrl("/algorithms"),
      },
      publisher: {
        "@type": "Person",
        name: siteConfig.creator,
        url: siteConfig.links.github,
      },
    },
    breadcrumbStructuredData([
      { name: "Algorithms", path: "/algorithms" },
      { name: algorithm.name, path },
    ]),
    faqStructuredData(guide.faq),
  ];

  return (
    <>
      <StructuredData data={structuredData} />
      <GlobalHeader
        page={algorithm.shortName}
        parent={{ label: "Algorithms", href: "/algorithms" }}
      />

      <article className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-4 py-10 sm:px-8">
        {/* 400 px specimen + 12 px padding + 1 px border on each side: shown 1:1. */}
        <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,26.625rem)_1fr] lg:gap-14">
          <div className="border-line-strong bg-ink-sunken border p-3">
            <CompareSlider
              after={{
                src: algorithm.preview,
                alt: `A CRT terminal on a checkered table, dithered with ${algorithm.name} in 1-bit`,
              }}
              before={{
                src: PREVIEW_SOURCE,
                alt: "The same terminal before dithering",
              }}
              width={PREVIEW_SIZE}
              height={PREVIEW_SIZE}
              beforeSizes={`(max-width: 480px) 100vw, ${PREVIEW_SIZE}px`}
            />
          </div>

          <div className="flex flex-col">
            <p className="text-paper-dim flex items-center gap-3 text-sm">
              <span className="text-readout text-paper-dim">
                {String(index + 1).padStart(2, "0")}
              </span>
              <Link
                href={`/algorithms#family-${category.id}`}
                className="hover:text-paper focus-visible:ring-safelight underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:outline-none"
              >
                {category.name}
              </Link>
            </p>
            <h1
              tabIndex={-1}
              className="font-display text-glow text-title mt-3 font-normal focus:outline-hidden"
            >
              {heading(algorithm)}
            </h1>
            <p className="text-paper-dim mt-5 max-w-prose text-lg leading-relaxed">
              {guide.intro}
            </p>

            <dl className="border-line mt-8 grid grid-cols-2 gap-x-6 gap-y-4 border-t pt-6 text-sm sm:grid-cols-3">
              <Meta label="Author">{algorithm.author ?? "Unknown"}</Meta>
              <Meta label="Year">
                <span className="text-readout">{algorithm.year ?? "—"}</span>
              </Meta>
              <Meta label="Complexity">
                <span className="capitalize">{algorithm.complexity}</span>
              </Meta>
            </dl>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href={`/editor?algorithm=${algorithm.slug}`}>
                  Use {algorithm.shortName} in the editor
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/algorithms">All algorithms</Link>
              </Button>
            </div>
          </div>
        </div>

        <section
          aria-labelledby="method-heading"
          className="flex flex-col gap-6"
        >
          <div className="flex max-w-prose flex-col gap-4">
            <h2 id="method-heading" className="text-heading font-semibold">
              How {algorithm.shortName} dithering works
            </h2>
            {guide.method.map((paragraph) => (
              <p key={paragraph} className="text-paper-dim leading-relaxed">
                {paragraph}
              </p>
            ))}
          </div>
          <AlgorithmMethod algorithm={algorithm.slug} />
          <AlgorithmPseudocode algorithm={algorithm.slug} />
        </section>

        <section aria-labelledby="use-heading" className="max-w-prose">
          <h2 id="use-heading" className="text-heading font-semibold">
            When to use it (and when not to)
          </h2>
          <ul className="text-paper-dim mt-4 flex list-disc flex-col gap-3 pl-5 leading-relaxed">
            {(
              [
                ["Best for", guide.use.bestFor],
                ["Works well with", guide.use.worksWith],
                ["Watch out for", guide.use.watchOut],
                ["In animation", guide.use.animation],
              ] as const
            ).map(([label, text]) => (
              <li key={label}>
                <strong className="text-paper font-semibold">{label}:</strong>{" "}
                <RichText parts={text} />
              </li>
            ))}
          </ul>
        </section>

        <section
          aria-labelledby="compare-heading"
          className="flex flex-col gap-6"
        >
          <div className="max-w-prose">
            <h2 id="compare-heading" className="text-heading font-semibold">
              {algorithm.shortName} vs other algorithms
            </h2>
            <p className="text-paper-dim mt-2 leading-relaxed">
              The same terminal in 1-bit, center crop at actual size.
            </p>
          </div>

          <ul className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {guide.compare.map(({ slug }) => {
              const other = getAlgorithm(slug)!;
              return (
                <li key={slug}>
                  <figure className="flex flex-col gap-2">
                    <div className="border-line-strong bg-ink-sunken border">
                      <Image
                        src={other.preview}
                        alt={`Center of the terminal specimen dithered with ${other.name}`}
                        width={PREVIEW_SIZE}
                        height={PREVIEW_SIZE}
                        unoptimized
                        className="aspect-square w-full object-none [image-rendering:pixelated]"
                      />
                    </div>
                    <figcaption className="text-sm">
                      {slug === algorithm.slug ? (
                        <span className="text-paper font-semibold">
                          {other.shortName}
                        </span>
                      ) : (
                        <Link href={`/algorithms/${slug}`} className={textLink}>
                          {other.shortName}
                        </Link>
                      )}
                    </figcaption>
                  </figure>
                </li>
              );
            })}
          </ul>

          <div
            role="region"
            aria-label={`${algorithm.shortName} comparison table`}
            // Scrolls sideways on phones; focusable so keyboards can too.
            // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
            tabIndex={0}
            className="focus-visible:ring-safelight overflow-x-auto focus-visible:ring-2 focus-visible:outline-none"
          >
            <table className="border-line w-full min-w-xl border-collapse border text-left text-sm">
              <caption className="sr-only">
                {algorithm.shortName} compared with{" "}
                {guide.compare
                  .slice(1)
                  .map(({ slug }) => getAlgorithm(slug)!.shortName)
                  .join(", ")}
              </caption>
              <thead>
                <tr className="border-line border-b">
                  {["Algorithm", "Method", "Animation", "Look"].map((col) => (
                    <th
                      key={col}
                      scope="col"
                      className="text-caps text-paper-dim px-4 py-3 font-normal"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {guide.compare.map(({ slug, look }) => {
                  const other = getAlgorithm(slug)!;
                  return (
                    <tr key={slug} className="border-line border-b">
                      <th scope="row" className="px-4 py-3 font-semibold">
                        {slug === algorithm.slug ? (
                          other.shortName
                        ) : (
                          <Link
                            href={`/algorithms/${slug}`}
                            className={textLink}
                          >
                            {other.shortName}
                          </Link>
                        )}
                      </th>
                      <td className="text-paper-dim px-4 py-3">
                        {methodSummary(slug)}
                      </td>
                      <td className="text-paper-dim px-4 py-3">
                        {getMethod(slug).kind === "diffusion"
                          ? "Flickers"
                          : "Stable"}
                      </td>
                      <td className="text-paper-dim px-4 py-3">{look}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section aria-labelledby="try-heading" className="max-w-prose">
          <h2 id="try-heading" className="text-heading font-semibold">
            Try {algorithm.shortName} on your image
          </h2>
          <p className="text-paper-dim mt-2 leading-relaxed">
            Open the editor with {algorithm.shortName} already selected, drop in
            a photo or an animated GIF, {tryTip(algorithm.slug)}, pick a palette
            and export the result. Free, no account, no watermark, and your
            image never leaves your device.
          </p>
          <Button asChild size="lg" className="mt-6">
            <Link href={`/editor?algorithm=${algorithm.slug}`}>
              Open {algorithm.shortName} in the editor
            </Link>
          </Button>
        </section>

        <section aria-labelledby="faq-heading">
          <h2 id="faq-heading" className="text-heading mb-4 font-semibold">
            {algorithm.shortName} FAQ
          </h2>
          <FaqList faq={guide.faq} />
        </section>

        <nav
          aria-label="More algorithms"
          className="border-line grid gap-4 border-t pt-8 sm:grid-cols-2"
        >
          {previous ? (
            <PagerLink
              href={`/algorithms/${previous.slug}`}
              direction="Previous"
              name={previous.shortName}
            />
          ) : (
            <span />
          )}
          {next && (
            <PagerLink
              href={`/algorithms/${next.slug}`}
              direction="Next"
              name={next.shortName}
              alignEnd
            />
          )}
          <Link
            href="/algorithms"
            className={`${textLink} self-start text-sm sm:col-span-2`}
          >
            All dithering algorithms
          </Link>
        </nav>
      </article>
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-8">
        <SiteFooter />
      </div>
    </>
  );
}

/** Comparison table cell: how the algorithm decides, from the engine. */
function methodSummary(slug: AlgorithmId) {
  const method = getMethod(slug);
  if (method.kind === "diffusion") {
    const { taps, divisor } = method.kernel;
    const carried = taps.reduce((sum, [, , weight]) => sum + weight, 0);
    return `Error to ${taps.length} neighbors (${Math.round((carried / divisor) * 100)}% carried)`;
  }
  if (method.kind === "ordered") {
    const { size } = method.matrix();
    return `${size}×${size} threshold matrix`;
  }
  if (method.kind === "screen") {
    return method.lines ? "Angled line screen" : "Angled dot screen";
  }
  return "Random threshold";
}

/** The setting worth trying first, by family. */
function tryTip(slug: AlgorithmId) {
  const kind = getMethod(slug).kind;
  if (kind === "diffusion") {
    return "adjust how much error travels with the Error diffusion slider";
  }
  if (kind === "screen") return "set the screen size and angle";
  return "choose the processing scale for the dot size";
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

function PagerLink({
  href,
  direction,
  name,
  alignEnd = false,
}: {
  href: string;
  direction: string;
  name: string;
  alignEnd?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`group border-line hover:border-line-strong focus-visible:ring-safelight flex flex-col gap-1 border p-4 transition-colors focus-visible:ring-2 focus-visible:outline-none ${alignEnd ? "sm:items-end sm:text-right" : ""}`}
    >
      <span className="text-label text-paper-dim">{direction}</span>
      <span className="group-hover:text-paper-hot text-lg font-semibold transition-colors">
        {name}
      </span>
    </Link>
  );
}
