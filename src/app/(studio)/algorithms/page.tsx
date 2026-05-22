import { AlgorithmCard } from "@/components/algorithm-card";
import { GlobalHeader } from "@/components/global-header";
import { Button } from "@/components/ui/button";
import { BreadcrumbItem, BreadcrumbLink } from "@/components/ui/breadcrumb";
import { BreadcrumbProvider } from "@/contexts/breadcrumb-context";
import algorithms from "@/data/algorithms.json";
import Link from "next/link";

export default function AlgorithmsPage() {
  return (
    <BreadcrumbProvider
      extra={
        <BreadcrumbItem>
          <BreadcrumbLink href="/algorithms">Algorithms</BreadcrumbLink>
        </BreadcrumbItem>
      }
    >
      <GlobalHeader />
      <div className="flex flex-col gap-4 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-3xl">
            <h1
              tabIndex={-1}
              className="text-2xl font-semibold focus:outline-hidden"
            >
              Dithering Algorithms
            </h1>
            <p className="text-muted-foreground mt-2">
              Compare error diffusion, ordered dithering, blue-noise, and
              noise-based techniques before applying them in the PixelSynth
              editor.
            </p>
          </div>
          <Button asChild variant="outline" className="self-start sm:self-auto">
            <Link href="/editor">Open editor</Link>
          </Button>
        </div>
        <section
          aria-label="Dithering algorithm catalog"
          className="grid gap-4"
          style={{
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          }}
        >
          {algorithms.map((alg, index) => (
            <AlgorithmCard
              key={alg.algorithm}
              data={alg}
              preloadPreview={index < 4}
            />
          ))}
        </section>
      </div>
    </BreadcrumbProvider>
  );
}
