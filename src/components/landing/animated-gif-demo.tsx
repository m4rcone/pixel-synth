"use client";

import { useState } from "react";
import Image from "next/image";
import { Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";

const imageClass = "w-full [image-rendering:pixelated]";

/**
 * The animated sample, dithered, in a loop. A GIF can't be paused, so pausing
 * swaps it for its first frame. Until the user chooses, CSS picks the still
 * under reduced motion, so the GIF never flashes before hydration.
 */
export function AnimatedGifDemo({
  src,
  still,
  width,
  height,
  alt,
  caption,
}: {
  src: string;
  /** First frame, shown while paused. */
  still: string;
  width: number;
  height: number;
  alt: string;
  caption: string;
}) {
  const reducedMotion = usePrefersReducedMotion();
  const [choice, setChoice] = useState<boolean | null>(null);
  const playing = choice ?? !reducedMotion;

  const image = (src: string, className?: string) => (
    <Image
      key={src}
      src={src}
      alt={alt}
      width={width}
      height={height}
      unoptimized
      className={className ? `${imageClass} ${className}` : imageClass}
    />
  );

  return (
    <figure className="flex flex-col gap-3">
      <div className="bg-ink-sunken border-line-strong border p-3">
        {choice === null ? (
          <>
            {image(src, "motion-reduce:hidden")}
            {image(still, "motion-safe:hidden")}
          </>
        ) : (
          image(playing ? src : still)
        )}
      </div>
      <figcaption className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-readout text-paper-dim">{caption}</span>
        <Button
          variant="outline"
          size="icon-sm"
          aria-label={playing ? "Pause GIF" : "Play GIF"}
          onClick={() => setChoice(!playing)}
        >
          {playing ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
        </Button>
      </figcaption>
    </figure>
  );
}
