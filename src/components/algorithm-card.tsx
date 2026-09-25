import { Cpu, Gauge } from "lucide-react";
import { AlgorithmCardPreview } from "@/components/algorithm-card-preview";
import { getCategoryName, type AlgorithmInfo } from "@/lib/algorithms";

export function AlgorithmCard({
  algorithm: data,
  index = 0,
  preloadPreview = false,
}: {
  algorithm: AlgorithmInfo;
  index?: number;
  preloadPreview?: boolean;
}) {
  const algorithmId = `algorithm-${data.slug}`;
  const titleId = `${algorithmId}-title`;
  const complexityColor =
    data.complexity === "high"
      ? "border-safelight/40 bg-safelight/10 text-safelight"
      : data.complexity === "medium"
        ? "border-line-strong bg-white/5 text-foreground"
        : "border-line text-paper-dim";

  const complexityLabel = `${data.complexity} complexity`;

  const performanceDots = Array.from({ length: 5 }).map((_, i) => (
    <span
      key={i}
      className={`inline-block h-1.5 w-1.5 rounded-full ${
        i < data.cost ? "bg-safelight" : "bg-line-strong"
      }`}
    />
  ));

  return (
    <article
      id={algorithmId}
      aria-labelledby={titleId}
      style={{ animationDelay: `${Math.min(index, 8) * 0.05}s` }}
      className="lab-fade group bg-card border-line hover:border-line-strong hover:bg-accent relative flex h-full flex-col overflow-hidden rounded-xl border transition-colors"
    >
      <AlgorithmCardPreview
        algorithm={data.name}
        preview={data.preview}
        preload={preloadPreview}
      />

      <div className="flex flex-1 flex-col p-5">
        <div className="mb-3 flex items-center justify-between font-mono text-[10px] tracking-[0.18em] uppercase">
          <span className="text-safelight">
            {String(index + 1).padStart(2, "0")}
          </span>
          <span className="text-paper-dim">
            {getCategoryName(data.category)} ·{" "}
            <span className="capitalize">{data.era}</span>
          </span>
        </div>

        <h2
          id={titleId}
          className="font-display text-xl leading-tight tracking-tight"
        >
          {data.name}
        </h2>

        <p className="text-paper-dim mt-2 flex-1 text-sm leading-relaxed">
          {data.description}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <Cpu className="text-paper-dim h-3 w-3" aria-hidden="true" />
            <span
              aria-label={complexityLabel}
              className={`rounded-full border px-2 py-0.5 font-mono text-[10px] tracking-[0.1em] uppercase ${complexityColor}`}
            >
              {data.complexity}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Gauge className="text-paper-dim h-3 w-3" aria-hidden="true" />
            <span className="sr-only">Processing cost: {data.cost} of 5</span>
            <div aria-hidden="true" className="flex gap-1">
              {performanceDots}
            </div>
          </div>
        </div>

        <div className="border-line text-paper-dim mt-4 flex items-center justify-between border-t pt-3 font-mono text-[10px] tracking-[0.12em] uppercase">
          <span>{data.author ?? "—"}</span>
          <span>{data.year ?? "—"}</span>
        </div>
      </div>
    </article>
  );
}
