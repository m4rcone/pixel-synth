import Link from "next/link";
import { AlgorithmCard } from "@/components/algorithm-card";
import { GlobalHeader } from "@/components/global-header";
import { Button } from "@/components/ui/button";
import { ALGORITHMS, algorithmsByCategory } from "@/lib/algorithms";

const FAMILY_NOTES: Record<string, string> = {
  "error-diffusion":
    "Each pixel is rounded to black or white and the rounding error is pushed onto the neighbors still to be processed. Organic and detailed.",
  ordered:
    "Each pixel is compared with a threshold matrix tiled across the image. Fast, parallel and deliberately textured.",
  noise:
    "Thresholds come from noise instead of a fixed pattern, trading structure for grain.",
};

export default function AlgorithmsPage() {
  const families = algorithmsByCategory();
  // Frame numbers run across the whole sheet, in catalog order.
  const frameOf = new Map(ALGORITHMS.map((a, i) => [a.slug, i + 1]));

  return (
    <>
      <GlobalHeader page="Algorithms" />
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-12 px-4 py-10 sm:px-8">
        <header className="border-line flex flex-col gap-6 border-b pb-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <h1
              tabIndex={-1}
              className="font-display text-title font-medium focus:outline-hidden"
            >
              Dithering algorithms
            </h1>
            <Button asChild variant="outline">
              <Link href="/editor">Open editor</Link>
            </Button>
          </div>
          <p className="text-paper-dim max-w-2xl text-lg leading-relaxed">
            {ALGORITHMS.length} techniques, each shown on the same sphere.
            Compare error diffusion, ordered dithering, blue-noise and
            noise-based techniques before applying them in the editor.
          </p>
          <nav aria-label="Algorithm families">
            <ul className="flex flex-wrap gap-2">
              {families.map((family) => (
                <li key={family.id}>
                  <a
                    href={`#family-${family.id}`}
                    className="border-line-strong text-paper-dim hover:text-paper hover:border-paper/40 focus-visible:ring-safelight inline-flex h-9 items-center gap-2 rounded-full border px-3.5 text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none"
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
                className="font-display text-heading font-medium"
              >
                {family.name}
              </h2>
              <p className="text-paper-dim leading-relaxed">
                {FAMILY_NOTES[family.id]}
              </p>
            </div>
            <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,17rem),1fr))] gap-4">
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
    </>
  );
}
