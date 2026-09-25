import { AlgorithmCard } from "@/components/algorithm-card";
import { GlobalHeader } from "@/components/global-header";
import { Button } from "@/components/ui/button";
import { ALGORITHMS } from "@/lib/algorithms";
import Link from "next/link";

export default function AlgorithmsPage() {
  return (
    <>
      <GlobalHeader page="Algorithms" />
      <div className="relative">
        {/* Atmospheric backdrop */}
        <div
          aria-hidden="true"
          className="lab-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(120%_80%_at_50%_-10%,black,transparent_75%)] opacity-50"
        />

        <div className="relative flex flex-col gap-6 px-5 py-8 sm:px-8">
          <div className="border-line flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-3xl">
              <p className="text-paper-dim mb-3 flex items-center gap-2 font-mono text-[10px] tracking-[0.22em] uppercase">
                <span className="text-safelight">✳</span>
                The catalog — {ALGORITHMS.length} techniques
              </p>
              <h1
                tabIndex={-1}
                className="font-display text-[clamp(2.25rem,5vw,3.5rem)] leading-[0.95] tracking-[-0.02em] focus:outline-hidden"
              >
                Dithering Algorithms
              </h1>
              <p className="text-paper-dim mt-4 max-w-xl leading-relaxed">
                Compare error diffusion, ordered dithering, blue-noise, and
                noise-based techniques before applying them in the editor.
              </p>
            </div>
            <Button
              asChild
              variant="outline"
              className="border-line-strong self-start bg-transparent font-mono text-xs tracking-[0.12em] uppercase hover:bg-white/5 sm:self-auto"
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
            {ALGORITHMS.map((alg, index) => (
              <AlgorithmCard
                key={alg.slug}
                algorithm={alg}
                index={index}
                preloadPreview={index < 4}
              />
            ))}
          </section>
        </div>
      </div>
    </>
  );
}
