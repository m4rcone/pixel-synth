"use client";

import Image from "next/image";
import { useState } from "react";
import { Eye, EyeClosed } from "lucide-react";

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
    <div className="relative aspect-square w-full overflow-hidden border-b border-[var(--line)] bg-[#08080a]">
      <Image
        src={!showOriginal ? preview : "/250/sphere-250.png"}
        alt={
          showOriginal
            ? "Original sphere image before dithering"
            : `${algorithm} dithering preview`
        }
        fill
        className="object-cover"
        sizes="(max-width: 768px) 100vw, 250px"
        preload={preload}
      />

      {/* state tag */}
      <span className="font-mono pointer-events-none absolute top-2 left-2 rounded-sm border border-[var(--line-strong)] bg-[var(--background)]/70 px-1.5 py-0.5 text-[9px] tracking-[0.16em] text-[var(--paper-dim)] uppercase backdrop-blur-sm">
        {showOriginal ? "Source" : "Dithered"}
      </span>

      <button
        type="button"
        onClick={() => setShowOriginal((prev) => !prev)}
        className="absolute right-2 bottom-2 rounded-full border border-[var(--line-strong)] bg-[var(--background)]/70 p-1.5 text-foreground backdrop-blur-sm transition-colors hover:border-[var(--safelight)] hover:text-[var(--safelight)] focus-visible:ring-2 focus-visible:ring-[var(--safelight)] focus-visible:outline-none"
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
