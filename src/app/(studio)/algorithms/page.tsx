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
      <div className="relative">
        {/* Atmospheric backdrop */}
        <div
          aria-hidden="true"
          className="lab-grid pointer-events-none absolute inset-0 opacity-50 [mask-image:radial-gradient(120%_80%_at_50%_-10%,black,transparent_75%)]"
        />

        <div className="relative flex flex-col gap-6 px-5 py-8 sm:px-8">
          <div className="flex flex-col gap-4 border-b border-[var(--line)] pb-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-3xl">
              <p className="font-mono mb-3 flex items-center gap-2 text-[10px] tracking-[0.22em] text-[var(--paper-dim)] uppercase">
                <span className="text-[var(--safelight)]">✳</span>
                The catalog — {algorithms.length} techniques
              </p>
              <h1
                tabIndex={-1}
                className="font-display text-[clamp(2.25rem,5vw,3.5rem)] leading-[0.95] tracking-[-0.02em] focus:outline-hidden"
              >
                Dithering Algorithms
              </h1>
              <p className="mt-4 max-w-xl leading-relaxed text-[var(--paper-dim)]">
                Compare error diffusion, ordered dithering, blue-noise, and
                noise-based techniques before applying them in the editor.
              </p>
            </div>
            <Button
              asChild
              variant="outline"
              className="font-mono self-start border-[var(--line-strong)] bg-transparent text-xs tracking-[0.12em] uppercase hover:bg-white/5 sm:self-auto"
            >
              <Link href="/editor">Open editor ↗</Link>
            </Button>
          </div>

          <section
            aria-label="Dithering algorithm catalog"
            className="grid gap-4 pb-4"
            style={{
              gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))",
            }}
          >
            {algorithms.map((alg, index) => (
              <AlgorithmCard
                key={alg.algorithm}
                data={alg}
                index={index}
                preloadPreview={index < 4}
              />
            ))}
          </section>
        </div>
      </div>
    </BreadcrumbProvider>
  );
}
