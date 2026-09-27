import type { Metadata } from "next";
import Link from "next/link";
import { StructuredData } from "@/components/structured-data";
import { AlgorithmCard } from "@/components/algorithm-card";
import { GlobalHeader } from "@/components/global-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { ALGORITHMS, algorithmsByCategory } from "@/lib/algorithms";
import {
  absoluteUrl,
  breadcrumbStructuredData,
  pageMetadata,
  siteConfig,
} from "@/lib/site";

const description = `Compare ${ALGORITHMS.length} dithering algorithms on one image: Floyd–Steinberg, Atkinson, Bayer, blue noise, halftone and more, each with its kernel or threshold matrix.`;

export const metadata: Metadata = pageMetadata({
  title: "Dithering Algorithms Compared",
  description,
  path: "/algorithms",
});

const structuredData = [
  {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `Dithering Algorithms | ${siteConfig.name}`,
    url: absoluteUrl("/algorithms"),
    description,
    inLanguage: "en",
    isPartOf: {
      "@type": "WebSite",
      name: siteConfig.name,
      url: siteConfig.url,
    },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: ALGORITHMS.length,
      itemListElement: ALGORITHMS.map((algorithm, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: absoluteUrl(`/algorithms/${algorithm.slug}`),
        name: algorithm.name,
        description: algorithm.description,
        image: absoluteUrl(algorithm.preview),
      })),
    },
  },
  breadcrumbStructuredData([{ name: "Algorithms", path: "/algorithms" }]),
];

export default function AlgorithmsPage() {
  const families = algorithmsByCategory();
  // Frame numbers run across the whole sheet, in catalog order.
  const frameOf = new Map(ALGORITHMS.map((a, i) => [a.slug, i + 1]));

  return (
    <>
      <StructuredData data={structuredData} />
      <GlobalHeader page="Algorithms" />
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-14 px-4 py-10 sm:px-8">
        <header className="border-line flex flex-col gap-6 border-b pb-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <h1
              tabIndex={-1}
              className="font-display text-glow text-title font-normal focus:outline-hidden"
            >
              Dithering algorithms
            </h1>
            <Button asChild variant="outline">
              <Link href="/editor">Open editor</Link>
            </Button>
          </div>
          <p className="text-paper-dim max-w-2xl text-lg leading-relaxed">
            {ALGORITHMS.length} techniques, each shown on the same specimen: a
            CRT terminal on a checkered table. Compare error diffusion, ordered,
            noise-based and halftone screen dithering before applying them in
            the editor.
          </p>
          <nav aria-label="Algorithm families">
            <ul className="flex flex-wrap gap-2">
              {families.map((family) => (
                <li key={family.id}>
                  <a
                    href={`#family-${family.id}`}
                    className="border-line-strong text-paper-dim hover:text-paper-hot hover:border-paper focus-visible:ring-safelight inline-flex h-9 items-center gap-2 border px-3.5 text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none"
                  >
                    {family.name}
                    <span className="text-readout">
                      {family.algorithms.length}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </header>

        {families.map((family) => (
          <section
            key={family.id}
            id={`family-${family.id}`}
            aria-labelledby={`family-${family.id}-heading`}
            className="scroll-mt-20"
          >
            <div className="mb-6 flex max-w-3xl flex-col gap-2">
              <h2
                id={`family-${family.id}-heading`}
                className="text-heading font-semibold"
              >
                {family.name}
              </h2>
              <p className="text-paper-dim leading-relaxed">
                {family.description}
              </p>
            </div>
            <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,13rem),1fr))] gap-4">
              {family.algorithms.map((algorithm) => {
                const frame = frameOf.get(algorithm.slug)!;
                return (
                  <li key={algorithm.slug}>
                    <AlgorithmCard
                      algorithm={algorithm}
                      frame={frame}
                      preloadPreview={frame <= 4}
                    />
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-8">
        <SiteFooter />
      </div>
    </>
  );
}
