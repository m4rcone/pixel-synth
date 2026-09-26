import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AlgorithmMethod } from "@/components/algorithm-method";
import { CompareSlider } from "@/components/compare-slider";
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
} from "@/lib/algorithms";
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

/** Meta description: the lede's first sentence and a call to action. */
function describe(algorithm: Algorithm) {
  const [lede] = algorithm.description.split(/(?<=\.) /);
  return `${lede} See it before and after, then try it free in your browser.`;
}

/** "Atkinson Dithering", "Random Dithering". */
const title = (algorithm: Algorithm) => `${ditheringName(algorithm)} Dithering`;

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const algorithm = getAlgorithm((await params).slug);
  if (!algorithm) return {};
  return pageMetadata({
    title: title(algorithm),
    description: describe(algorithm),
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

  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "TechArticle",
      headline: title(algorithm),
      description: describe(algorithm),
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
              {algorithm.name}
            </h1>
            <p className="text-paper-dim mt-5 max-w-prose text-lg leading-relaxed">
              {algorithm.description}
            </p>

            <dl className="border-line mt-8 grid grid-cols-2 gap-x-6 gap-y-4 border-t pt-6 text-sm sm:grid-cols-4">
              <Meta label="Author">{algorithm.author ?? "Unknown"}</Meta>
              <Meta label="Year">
                <span className="text-readout">{algorithm.year ?? "—"}</span>
              </Meta>
              <Meta label="Complexity">
                <span className="capitalize">{algorithm.complexity}</span>
              </Meta>
              <Meta label="Processing cost">
                <span className="text-readout">{algorithm.cost} / 5</span>
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
          <div className="max-w-prose">
            <h2 id="method-heading" className="text-heading font-semibold">
              How it works
            </h2>
            <p className="text-paper-dim mt-2 leading-relaxed">
              {category.description}
            </p>
          </div>
          <AlgorithmMethod algorithm={algorithm.slug} />
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
        </nav>
      </article>
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-8">
        <SiteFooter />
      </div>
    </>
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
