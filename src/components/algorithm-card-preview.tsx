"use client";

import Image from "next/image";
import { useState } from "react";
import { Eye, EyeClosed } from "lucide-react";
import { PREVIEW_SOURCE } from "@/lib/algorithms";

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
    <div className="border-line relative aspect-square w-full overflow-hidden border-b bg-[#08080a]">
      <Image
        src={!showOriginal ? preview : PREVIEW_SOURCE}
        alt={
          showOriginal
            ? "Original sphere image before dithering"
            : `${algorithm} dithering preview`
        }
        fill
        // Served as-is: re-encoding would smear the 1-bit dither pattern.
        unoptimized
        className={
          showOriginal
            ? "object-cover"
            : "object-cover [image-rendering:pixelated]"
        }
        preload={preload}
      />

      {/* state tag */}
      <span className="border-line-strong bg-ink/70 text-paper-dim pointer-events-none absolute top-2 left-2 rounded-sm border px-1.5 py-0.5 font-mono text-[9px] tracking-[0.16em] uppercase backdrop-blur-sm">
        {showOriginal ? "Source" : "Dithered"}
      </span>

      <button
        type="button"
        onClick={() => setShowOriginal((prev) => !prev)}
        className="text-foreground border-line-strong bg-ink/70 hover:border-safelight hover:text-safelight focus-visible:ring-safelight absolute right-2 bottom-2 rounded-full border p-1.5 backdrop-blur-sm transition-colors focus-visible:ring-2 focus-visible:outline-none"
        aria-label={
          showOriginal ? "Show algorithm preview" : "Show original image"
        }
      >
        {showOriginal ? (
          <EyeClosed width={15} height={15} aria-hidden="true" />
        ) : (
          <Eye width={15} height={15} aria-hidden="true" />
        )}
      </button>
    </div>
  );
}
