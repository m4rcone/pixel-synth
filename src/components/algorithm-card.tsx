import Link from "next/link";
import { AlgorithmCardPreview } from "@/components/algorithm-card-preview";
import { getCategoryName, type AlgorithmInfo } from "@/lib/algorithms";
import { cn } from "@/lib/utils";

export function AlgorithmCard({
  algorithm,
  frame,
  preloadPreview = false,
}: {
  algorithm: AlgorithmInfo;
  /** Position on the contact sheet, printed like a film frame number. */
  frame: number;
  preloadPreview?: boolean;
}) {
  const id = `algorithm-${algorithm.slug}`;
  const titleId = `${id}-title`;

  return (
    <article
      id={id}
      aria-labelledby={titleId}
      className="border-line bg-ink-raised hover:border-line-strong target:border-safelight flex h-full scroll-mt-20 flex-col overflow-hidden rounded-md border transition-colors"
    >
      <AlgorithmCardPreview
        algorithm={algorithm.name}
        preview={algorithm.preview}
        preload={preloadPreview}
      />

      <div className="flex flex-1 flex-col p-5">
        <p className="text-paper-dim flex items-center justify-between text-sm">
          <span className="text-readout text-safelight">
            {String(frame).padStart(2, "0")}
          </span>
          <span>
            {getCategoryName(algorithm.category)},{" "}
            {algorithm.era === "classic" ? "classic" : "modern"}
          </span>
        </p>

        <h3 id={titleId} className="font-display text-heading mt-3 font-medium">
          <Link
            href={`/algorithms/${algorithm.slug}`}
            className="hover:text-safelight focus-visible:ring-safelight rounded-sm transition-colors focus-visible:ring-2 focus-visible:outline-none"
          >
            {algorithm.name}
          </Link>
        </h3>

        <p className="text-paper-dim mt-2 flex-1 text-sm leading-relaxed">
          {algorithm.description}
        </p>

        <dl className="border-line mt-5 grid grid-cols-2 gap-x-4 gap-y-3 border-t pt-4 text-sm">
          <Meta label="Author">{algorithm.author ?? "Unknown"}</Meta>
          <Meta label="Year">
            <span className="text-readout">{algorithm.year ?? "—"}</span>
          </Meta>
          <Meta label="Complexity">
            <span className="capitalize">{algorithm.complexity}</span>
          </Meta>
          <Meta label="Processing cost">
            <span className="sr-only">{algorithm.cost} of 5</span>
            <span aria-hidden="true" className="flex h-5 items-center gap-1">
              {Array.from({ length: 5 }, (_, i) => (
                <span
                  key={i}
                  className={cn(
                    "size-1.5 rounded-full",
                    i < algorithm.cost ? "bg-paper" : "bg-line-strong",
                  )}
                />
              ))}
            </span>
          </Meta>
        </dl>

        <Link
          href={`/editor?algorithm=${algorithm.slug}`}
          className="text-paper hover:text-safelight focus-visible:ring-safelight decoration-line-strong mt-5 self-start rounded-sm text-sm font-medium underline underline-offset-4 transition-colors focus-visible:ring-2 focus-visible:outline-none"
        >
          Use in the editor
          <span className="sr-only">: {algorithm.name}</span>
        </Link>
      </div>
    </article>
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
    <div className="min-w-0">
      <dt className="text-label text-paper-dim">{label}</dt>
      <dd className="text-paper mt-0.5 truncate">{children}</dd>
    </div>
  );
}
