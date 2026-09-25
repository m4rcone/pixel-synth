"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import {
  getAlgorithm,
  getCategoryName,
  PREVIEW_SOURCE,
  type AlgorithmId,
} from "@/lib/algorithms";

// Each render is the same source sphere processed by a real PixelSynth
// algorithm, taken from the catalog.
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
).map((slug) => {
  const algorithm = getAlgorithm(slug)!;
  return {
    algorithm: algorithm.shortName,
    category: getCategoryName(algorithm.category),
    year: algorithm.year ?? "",
    image: algorithm.preview,
  };
});

const ORIGINAL = PREVIEW_SOURCE;

export function DitherSpecimen() {
  const prefersReducedMotion = usePrefersReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [reveal, setReveal] = useState(38); // % of original (left) shown
  const [dragging, setDragging] = useState(false);
  const [hovered, setHovered] = useState(false);

  const current = SPECIMENS[index];

  // Auto-advance through algorithms; pause on hover, drag or reduced motion.
  useEffect(() => {
    if (prefersReducedMotion || hovered || dragging) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % SPECIMENS.length);
    }, 2800);
    return () => window.clearInterval(id);
  }, [prefersReducedMotion, hovered, dragging]);

  const setFromClientX = useCallback((clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setReveal(Math.min(100, Math.max(0, pct)));
  }, []);

  return (
    <div
      className="lab-fade w-full max-w-md"
      style={{ animationDelay: "0.5s" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Frame */}
      <div className="relative rounded-xl border border-[var(--line-strong)] bg-[var(--ink-2)] p-3 shadow-[0_40px_80px_-40px_rgba(0,0,0,0.9)]">
        {/* Corner registration ticks */}
        <Corner className="top-1.5 left-1.5" />
        <Corner className="top-1.5 right-1.5 rotate-90" />
        <Corner className="bottom-1.5 left-1.5 -rotate-90" />
        <Corner className="right-1.5 bottom-1.5 rotate-180" />

        {/* Status bar */}
        <div className="mb-2.5 flex items-center justify-between px-1 font-mono text-[10px] tracking-[0.18em] text-[var(--paper-dim)] uppercase">
          <span className="flex items-center gap-1.5">
            <span
              className="lab-blink inline-block size-1.5 rounded-full bg-[var(--safelight)]"
              aria-hidden="true"
            />
            Developing
          </span>
          <span aria-hidden="true">
            {String(index + 1).padStart(2, "0")} /{" "}
            {String(SPECIMENS.length).padStart(2, "0")}
          </span>
        </div>

        {/* Comparison viewport */}
        <div
          ref={containerRef}
          className="lab-dots relative aspect-square w-full cursor-ew-resize touch-none overflow-hidden rounded-lg text-white/[0.04] select-none"
          onPointerDown={(e) => {
            (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
            setDragging(true);
            setFromClientX(e.clientX);
          }}
          onPointerMove={(e) => {
            if (dragging) setFromClientX(e.clientX);
          }}
          onPointerUp={() => setDragging(false)}
          onPointerCancel={() => setDragging(false)}
        >
          {/* AFTER — dithered render (full background) */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={current.image}
            src={current.image}
            alt={`Sphere rendered with the ${current.algorithm} dithering algorithm`}
            width={250}
            height={250}
            draggable={false}
            className="absolute inset-0 h-full w-full object-cover [image-rendering:pixelated]"
          />

          {/* BEFORE — original smooth render, clipped to the left */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={ORIGINAL}
            alt="Original ungraded sphere render before dithering"
            width={250}
            height={250}
            draggable={false}
            className="absolute inset-0 h-full w-full object-cover"
            style={{ clipPath: `inset(0 ${100 - reveal}% 0 0)` }}
          />

          {/* Scan sweep retriggered on each algorithm change */}
          {!prefersReducedMotion && (
            <div
              key={`scan-${index}`}
              aria-hidden="true"
              className="lab-scan pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-transparent via-white/15 to-transparent"
            />
          )}

          {/* Labels */}
          <span className="pointer-events-none absolute bottom-2 left-2 rounded bg-black/55 px-1.5 py-0.5 font-mono text-[9px] tracking-[0.2em] text-white/85 uppercase backdrop-blur-sm">
            Source
          </span>
          <span className="pointer-events-none absolute right-2 bottom-2 rounded bg-black/55 px-1.5 py-0.5 font-mono text-[9px] tracking-[0.2em] text-white/85 uppercase backdrop-blur-sm">
            Dithered
          </span>

          {/* Divider + handle */}
          <div
            className="pointer-events-none absolute inset-y-0 z-10 w-px bg-white/70"
            style={{ left: `${reveal}%` }}
          >
            <button
              type="button"
              role="slider"
              aria-label="Reveal the original image"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(reveal)}
              aria-valuetext={`${Math.round(reveal)}% original`}
              onKeyDown={(e) => {
                if (e.key === "ArrowLeft") setReveal((r) => Math.max(0, r - 4));
                if (e.key === "ArrowRight")
                  setReveal((r) => Math.min(100, r + 4));
                if (e.key === "Home") setReveal(0);
                if (e.key === "End") setReveal(100);
              }}
              className="pointer-events-auto absolute top-1/2 left-1/2 grid size-8 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize place-items-center rounded-full border border-white/30 bg-black/60 text-white backdrop-blur-sm transition-colors hover:bg-black/80 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
            >
              <span
                aria-hidden="true"
                className="font-mono text-[11px] leading-none tracking-tighter"
              >
                {"<>"}
              </span>
            </button>
          </div>
        </div>

        {/* Caption + selector */}
        <div className="mt-3 flex items-end justify-between gap-3 px-1">
          <div className="min-w-0">
            <p
              className="font-display truncate text-lg leading-tight text-[var(--paper)] italic"
              aria-live="polite"
            >
              {current.algorithm}
            </p>
            <p className="font-mono text-[10px] tracking-[0.16em] text-[var(--paper-dim)] uppercase">
              {current.category} · {current.year}
            </p>
          </div>
          <div
            className="flex shrink-0 items-center gap-1.5"
            role="group"
            aria-label="Choose algorithm"
          >
            {SPECIMENS.map((s, i) => (
              <button
                key={s.image}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={s.algorithm}
                aria-pressed={i === index}
                className={`h-1.5 rounded-full transition-all focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none ${
                  i === index
                    ? "w-5 bg-[var(--safelight)]"
                    : "w-1.5 bg-white/25 hover:bg-white/50"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Corner({ className }: { className: string }) {
  return (
    <span
      aria-hidden="true"
      className={`absolute z-10 size-2.5 border-t border-l border-[var(--line-strong)] ${className}`}
    />
  );
}
