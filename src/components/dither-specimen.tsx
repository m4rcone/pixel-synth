"use client";

import { useEffect, useState } from "react";
import { CompareSlider } from "@/components/compare-slider";
import Image from "next/image";
import { Pause, Play } from "lucide-react";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import {
  getAlgorithm,
  getCategoryName,
  PREVIEW_SOURCE,
  type AlgorithmId,
} from "@/lib/algorithms";
import { cn } from "@/lib/utils";

// The same source sphere processed by real PixelSynth algorithms.
const SPECIMENS = (
  [
    "floyd-steinberg",
    "jarvis-judice-and-ninke-jjn",
    "stucki",
    "atkinson",
    "bayer-4-4",
    "bayer-8-8",
    "clustered-dot-halftone-ordered",
    "blue-noise",
    "void-and-cluster",
  ] satisfies AlgorithmId[]
).map((slug) => getAlgorithm(slug)!);

const ADVANCE_MS = 3200;

export function DitherSpecimen() {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [index, setIndex] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [hovered, setHovered] = useState(false);
  // Auto-advance stops for good once the visitor picks something or pauses.
  const [playing, setPlaying] = useState(true);

  const current = SPECIMENS[index];
  const advancing = playing && !prefersReducedMotion && !hovered && !dragging;

  useEffect(() => {
    if (!advancing) return;
    const id = window.setInterval(
      () => setIndex((i) => (i + 1) % SPECIMENS.length),
      ADVANCE_MS,
    );
    return () => window.clearInterval(id);
  }, [advancing]);

  return (
    <figure
      className="w-full max-w-md"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="border-line-strong bg-ink-raised relative rounded-md border p-3">
        <Corner className="top-1.5 left-1.5" />
        <Corner className="top-1.5 right-1.5 rotate-90" />
        <Corner className="bottom-1.5 left-1.5 -rotate-90" />
        <Corner className="right-1.5 bottom-1.5 rotate-180" />

        <CompareSlider
          after={{
            src: current.preview,
            alt: `Sphere dithered with ${current.name}`,
          }}
          before={{
            src: PREVIEW_SOURCE,
            alt: "The same sphere before dithering",
          }}
          onDraggingChange={setDragging}
        />

        <figcaption className="mt-3 flex items-start justify-between gap-3 px-1">
          <div className="min-w-0">
            <p className="truncate text-xl leading-tight font-semibold">
              {current.shortName}
            </p>
            <p className="text-paper-dim text-sm">
              {getCategoryName(current.category)}
              {current.year && (
                <span className="text-readout ml-2">{current.year}</span>
              )}
            </p>
          </div>
          {!prefersReducedMotion && (
            <button
              type="button"
              onClick={() => setPlaying((p) => !p)}
              aria-label={playing ? "Pause slideshow" : "Play slideshow"}
              className="text-paper-dim hover:text-paper hover:bg-accent focus-visible:ring-safelight grid size-9 shrink-0 place-items-center rounded-md transition-colors focus-visible:ring-2 focus-visible:outline-none"
            >
              {playing ? (
                <Pause className="size-4" aria-hidden="true" />
              ) : (
                <Play className="size-4" aria-hidden="true" />
              )}
            </button>
          )}
        </figcaption>

        <div
          role="group"
          aria-label="Choose an algorithm"
          className="mt-3 grid grid-cols-9 gap-1.5 px-1"
        >
          {SPECIMENS.map((s, i) => (
            <button
              key={s.slug}
              type="button"
              onClick={() => {
                setIndex(i);
                setPlaying(false);
              }}
              aria-label={s.shortName}
              aria-pressed={i === index}
              className={cn(
                // Only opacity animates (on the compositor); the border switches
                // instantly as the slideshow advances.
                "focus-visible:ring-safelight relative aspect-square overflow-hidden rounded-xs border transition-opacity focus-visible:ring-2 focus-visible:outline-none",
                i === index
                  ? "border-safelight"
                  : "border-line opacity-60 hover:opacity-100",
              )}
            >
              <Image
                src={s.preview}
                alt=""
                fill
                sizes="48px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      </div>
    </figure>
  );
}

function Corner({ className }: { className: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "border-line-strong absolute z-10 size-2.5 border-t border-l",
        className,
      )}
    />
  );
}
