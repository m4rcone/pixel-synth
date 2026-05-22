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
    <div className="bg-muted/30 relative aspect-square w-full">
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
      <button
        type="button"
        onClick={() => setShowOriginal((prev) => !prev)}
        className="bg-background/80 hover:bg-background absolute right-2 bottom-2 rounded-full p-1 shadow-sm transition"
        aria-label={
          showOriginal ? "Show algorithm preview" : "Show original image"
        }
      >
        {showOriginal ? (
          <EyeClosed width={16} height={16} />
        ) : (
          <Eye width={16} height={16} />
        )}
      </button>
    </div>
  );
}
