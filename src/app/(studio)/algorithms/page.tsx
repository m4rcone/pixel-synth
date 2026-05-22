import { AlgorithmCard } from "@/components/algorithm-card";
import { GlobalHeader } from "@/components/global-header";
import { BreadcrumbItem, BreadcrumbLink } from "@/components/ui/breadcrumb";
import { BreadcrumbProvider } from "@/contexts/breadcrumb-context";
import algorithms from "@/data/algorithms.json";

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
        <h1
          tabIndex={-1}
          className="text-2xl font-semibold focus:outline-hidden"
        >
          Dithering Algorithms
        </h1>
        <p className="text-muted-foreground">
          Learn how each algorithm transforms your image through pixel
          diffusion.
        </p>
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
