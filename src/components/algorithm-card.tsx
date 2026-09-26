import Image from "next/image";
import Link from "next/link";
import { getCategoryName, type AlgorithmInfo } from "@/lib/algorithms";

export function AlgorithmCard({
  algorithm,
  frame,
  preloadPreview = false,
}: {
  algorithm: AlgorithmInfo;
  /** Position in the catalog, printed as a two-digit index. */
  frame: number;
  preloadPreview?: boolean;
}) {
  const id = `algorithm-${algorithm.slug}`;
  const titleId = `${id}-title`;

  return (
    <article
      id={id}
      aria-labelledby={titleId}
      // The title link is stretched over the whole card; the editor link sits
      // above it (z-10) and stays independently clickable.
      className="group border-line-strong bg-ink-raised hover:border-paper target:border-safelight relative flex h-full scroll-mt-20 flex-col border transition-colors"
    >
      <p className="text-caps text-paper border-line flex items-center justify-between gap-3 truncate border-b px-4 py-3">
        <span className="text-readout text-paper-dim">
          {String(frame).padStart(2, "0")}
        </span>
        <span className="truncate">
          {getCategoryName(algorithm.category)},{" "}
          {algorithm.era === "classic" ? "classic" : "modern"}
        </span>
      </p>

      {/* Neutral well. Cards are narrower than the 400 px preview, so it is
          scaled down smoothly (nearest-neighbor would add moiré). */}
      <div className="border-line bg-ink-sunken border-b">
        <Image
          src={algorithm.preview}
          alt={`A CRT terminal on a checkered table, dithered with ${algorithm.name}`}
          width={400}
          height={400}
          sizes="(max-width: 640px) 100vw, 280px"
          unoptimized
          preload={preloadPreview}
          className="w-full"
        />
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex flex-col gap-1">
          <h3 id={titleId} className="text-heading font-semibold">
            <Link
              href={`/algorithms/${algorithm.slug}`}
              className="group-hover:text-paper-hot focus-visible:after:ring-safelight transition-colors after:absolute after:inset-0 after:content-[''] focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-inset"
            >
              {algorithm.name}
            </Link>
          </h3>
          <p className="text-readout text-paper-dim">
            {[algorithm.author, algorithm.year].filter(Boolean).join(" · ")}
          </p>
        </div>

        <div className="border-line mt-auto border-t pt-3">
          <Link
            href={`/editor?algorithm=${algorithm.slug}`}
            className="text-paper hover:text-paper-hot hover:decoration-paper-hot focus-visible:ring-safelight decoration-line-strong relative z-10 text-sm font-medium underline underline-offset-4 transition-colors focus-visible:ring-2 focus-visible:outline-none"
          >
            Use in the editor
            <span className="sr-only">: {algorithm.name}</span>
          </Link>
        </div>
      </div>
    </article>
  );
}
