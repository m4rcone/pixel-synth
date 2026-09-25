"use client";

import Image from "next/image";
import { useState } from "react";
import { PREVIEW_SOURCE } from "@/lib/algorithms";
import { cn } from "@/lib/utils";

export function AlgorithmCardPreview({
  algorithm,
  preview,
  preload = false,
}: {
  algorithm: string;
  preview: string;
  preload?: boolean;
}) {
  const [showOriginal, setShowOriginal] = useState(false);

  return (
    <div className="border-line bg-ink-sunken relative aspect-square w-full overflow-hidden border-b">
      <Image
        src={showOriginal ? PREVIEW_SOURCE : preview}
        alt={
          showOriginal
            ? "Original sphere before dithering"
            : `Sphere dithered with ${algorithm}`
        }
        fill
        sizes="(max-width: 640px) 100vw, 320px"
        // Served as-is: re-encoding would smear the 1-bit dither pattern.
        unoptimized
        preload={preload}
        className={cn(
          "object-cover",
          !showOriginal && "[image-rendering:pixelated]",
        )}
      />

      <button
        type="button"
        onClick={() => setShowOriginal((prev) => !prev)}
        aria-pressed={showOriginal}
        className={cn(
          "text-label focus-visible:ring-safelight absolute right-2 bottom-2 z-10 rounded-full border px-3 py-1.5 backdrop-blur-sm transition-colors focus-visible:ring-2 focus-visible:outline-none",
          showOriginal
            ? "border-paper bg-paper text-ink"
            : "border-white/25 bg-black/65 text-white hover:bg-black/80",
        )}
      >
        Show source
        <span className="sr-only"> for {algorithm}</span>
      </button>
    </div>
  );
}
