import { Cpu, Gauge } from "lucide-react";
import { AlgorithmCardPreview } from "@/components/algorithm-card-preview";
import { slugify } from "@/lib/slugify";

type Algorithm = {
  category: string;
  type: string;
  algorithm: string;
  description: string;
  complexity: string;
  year: number | string;
  author: string;
  performance: number;
  preview: string;
};

export function AlgorithmCard({
  data,
  index = 0,
  preloadPreview = false,
}: {
  data: Algorithm;
  index?: number;
  preloadPreview?: boolean;
}) {
  const algorithmId = `algorithm-${slugify(data.algorithm)}`;
  const titleId = `${algorithmId}-title`;
  const complexityColor =
    data.complexity === "high"
      ? "border-[var(--safelight)]/40 bg-[var(--safelight)]/10 text-[var(--safelight)]"
      : data.complexity === "medium"
        ? "border-[var(--line-strong)] bg-white/5 text-foreground"
        : "border-[var(--line)] text-[var(--paper-dim)]";

  const complexityLabel = `${data.complexity} complexity`;

  const performanceDots = Array.from({ length: 5 }).map((_, i) => (
    <span
      key={i}
      className={`inline-block h-1.5 w-1.5 rounded-full ${
        i < data.performance ? "bg-[var(--safelight)]" : "bg-[var(--line-strong)]"
      }`}
    />
  ));

  return (
    <article
      id={algorithmId}
      aria-labelledby={titleId}
      style={{ animationDelay: `${Math.min(index, 8) * 0.05}s` }}
      className="lab-fade group bg-card relative flex h-full flex-col overflow-hidden rounded-xl border border-[var(--line)] transition-colors hover:border-[var(--line-strong)] hover:bg-[var(--accent)]"
    >
      <AlgorithmCardPreview
        algorithm={data.algorithm}
        preview={data.preview}
        preload={preloadPreview}
      />

      <div className="flex flex-1 flex-col p-5">
        <div className="font-mono mb-3 flex items-center justify-between text-[10px] tracking-[0.18em] uppercase">
          <span className="text-[var(--safelight)]">
            {String(index + 1).padStart(2, "0")}
          </span>
          <span className="text-[var(--paper-dim)]">
            {data.category} · <span className="capitalize">{data.type}</span>
          </span>
        </div>

        <h2
          id={titleId}
          className="font-display text-xl leading-tight tracking-tight"
        >
          {data.algorithm}
        </h2>

        <p className="mt-2 flex-1 text-sm leading-relaxed text-[var(--paper-dim)]">
          {data.description}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <Cpu className="h-3 w-3 text-[var(--paper-dim)]" aria-hidden="true" />
            <span
              aria-label={complexityLabel}
              className={`font-mono rounded-full border px-2 py-0.5 text-[10px] tracking-[0.1em] uppercase ${complexityColor}`}
            >
              {data.complexity}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Gauge
              className="h-3 w-3 text-[var(--paper-dim)]"
              aria-hidden="true"
            />
            <span className="sr-only">
              Performance: {data.performance} of 5
            </span>
            <div aria-hidden="true" className="flex gap-1">
              {performanceDots}
            </div>
          </div>
        </div>

        <div className="font-mono mt-4 flex items-center justify-between border-t border-[var(--line)] pt-3 text-[10px] tracking-[0.12em] text-[var(--paper-dim)] uppercase">
          <span>{data.author}</span>
          {data.year && <span>{data.year}</span>}
        </div>
      </div>
    </article>
  );
}
