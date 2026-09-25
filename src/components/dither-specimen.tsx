"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
  const containerRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [reveal, setReveal] = useState(38); // % of the original shown
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

  const setFromClientX = useCallback((clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setReveal(
      Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100)),
    );
  }, []);

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

        <div
          ref={containerRef}
          className="bg-ink-sunken relative aspect-square w-full cursor-ew-resize touch-none overflow-hidden rounded-xs select-none"
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            setDragging(true);
            setFromClientX(e.clientX);
          }}
          onPointerMove={(e) => dragging && setFromClientX(e.clientX)}
          onPointerUp={() => setDragging(false)}
          onPointerCancel={() => setDragging(false)}
        >
          <Image
            src={current.preview}
            alt={`Sphere dithered with ${current.name}`}
            width={250}
            height={250}
            unoptimized
            priority
            draggable={false}
            className="absolute inset-0 size-full object-cover [image-rendering:pixelated]"
          />
          <Image
            src={PREVIEW_SOURCE}
            alt="The same sphere before dithering"
            width={250}
            height={250}
            unoptimized
            priority
            draggable={false}
            className="absolute inset-0 size-full object-cover"
            style={{ clipPath: `inset(0 ${100 - reveal}% 0 0)` }}
          />

          <span className="text-label pointer-events-none absolute bottom-2 left-2 rounded-xs bg-black/60 px-1.5 py-0.5 text-white/90">
            Source
          </span>
          <span className="text-label pointer-events-none absolute right-2 bottom-2 rounded-xs bg-black/60 px-1.5 py-0.5 text-white/90">
            Dithered
          </span>

          <div
            className="pointer-events-none absolute inset-y-0 z-10 w-px bg-white/75"
            style={{ left: `${reveal}%` }}
          >
            <button
              type="button"
              role="slider"
              aria-label="Before and after divider"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(reveal)}
              aria-valuetext={`${Math.round(reveal)}% of the original shown`}
              onKeyDown={(e) => {
                const moves: Record<string, (r: number) => number> = {
                  ArrowLeft: (r) => r - 4,
                  ArrowDown: (r) => r - 4,
                  ArrowRight: (r) => r + 4,
                  ArrowUp: (r) => r + 4,
                  Home: () => 0,
                  End: () => 100,
                };
                const move = moves[e.key];
                if (!move) return;
                e.preventDefault();
                setReveal((r) => Math.min(100, Math.max(0, move(r))));
              }}
              className="focus-visible:ring-safelight pointer-events-auto absolute top-1/2 left-1/2 grid size-9 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize place-items-center rounded-full border border-white/40 bg-black/65 text-white backdrop-blur-sm focus-visible:ring-2 focus-visible:outline-none"
            >
              <svg viewBox="0 0 16 16" aria-hidden="true" className="size-4">
                <path
                  d="M6 4 2 8l4 4M10 4l4 4-4 4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
              </svg>
            </button>
          </div>
        </div>

        <figcaption className="mt-3 flex items-start justify-between gap-3 px-1">
          <div className="min-w-0">
            <p className="font-display truncate text-xl leading-tight font-medium">
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
                "focus-visible:ring-safelight relative aspect-square overflow-hidden rounded-xs border transition-colors focus-visible:ring-2 focus-visible:outline-none",
                i === index
                  ? "border-safelight"
                  : "border-line opacity-60 hover:opacity-100",
              )}
            >
              <Image
                src={s.preview}
                alt=""
                fill
                unoptimized
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
