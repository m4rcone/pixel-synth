"use client";

import { useCallback, useRef, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

type CompareSliderProps = {
  before: { src: string; alt: string };
  after: { src: string; alt: string };
  /** Size of both images; the frame takes their aspect ratio. */
  width: number;
  height: number;
  /** `sizes` of the (optimized) "before" image. */
  beforeSizes: string;
  /** Extra classes for the "after" image (e.g. to change its scaling). */
  afterClassName?: string;
  /** Initial share of the "before" image shown, in percent. */
  initial?: number;
  /** Pointer position over the images as fractions (0–1), null when it leaves. */
  onPointerPosition?: (point: { x: number; y: number } | null) => void;
};

/**
 * Before/after comparison of two same-size images. The divider is a
 * keyboard-operable slider; the "after" image is drawn pixelated because it
 * is a dither render being upscaled.
 */
export function CompareSlider({
  before,
  after,
  width,
  height,
  beforeSizes,
  afterClassName,
  initial = 50,
  onPointerPosition,
}: CompareSliderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [reveal, setReveal] = useState(initial);
  const [dragging, setDragging] = useState(false);

  const setFromClientX = useCallback((clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setReveal(
      Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100)),
    );
  }, []);

  return (
    <div
      ref={containerRef}
      // Vertical swipes keep scrolling the page (the browser cancels the
      // pointer); horizontal ones move the divider.
      className="bg-ink-sunken relative w-full cursor-ew-resize touch-pan-y overflow-hidden select-none"
      style={{ aspectRatio: `${width} / ${height}` }}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        setDragging(true);
        // A touch may be the start of a scroll: only a drag moves the divider.
        if (e.pointerType !== "touch") setFromClientX(e.clientX);
      }}
      onPointerMove={(e) => {
        if (dragging) setFromClientX(e.clientX);
        if (onPointerPosition) {
          const rect = e.currentTarget.getBoundingClientRect();
          onPointerPosition({
            x: Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width)),
            y: Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height)),
          });
        }
      }}
      onPointerLeave={() => onPointerPosition?.(null)}
      onPointerUp={() => setDragging(false)}
      onPointerCancel={() => setDragging(false)}
    >
      <Image
        src={after.src}
        alt={after.alt}
        width={width}
        height={height}
        unoptimized
        priority
        draggable={false}
        className={cn(
          "pixelated absolute inset-0 size-full object-cover",
          afterClassName,
        )}
      />
      <Image
        src={before.src}
        alt={before.alt}
        width={width}
        height={height}
        // Continuous-tone PNG: served as WebP (≈ 3 KB instead of 112 KB).
        sizes={beforeSizes}
        quality={95}
        priority
        draggable={false}
        className="absolute inset-0 size-full object-cover"
        style={{ clipPath: `inset(0 ${100 - reveal}% 0 0)` }}
      />

      <div
        className="bg-paper-hot/75 pointer-events-none absolute inset-y-0 z-10 w-px"
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
          className="focus-visible:ring-safelight border-paper-hot/40 bg-ink/65 text-paper-hot pointer-events-auto absolute top-1/2 left-1/2 grid size-9 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize place-items-center border backdrop-blur-sm focus-visible:ring-2 focus-visible:outline-none"
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
  );
}
