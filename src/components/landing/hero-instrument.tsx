"use client";

import { useEffect, useState, type CSSProperties } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { CompareSlider } from "@/components/compare-slider";

/** Real pixels between two ruler ticks. */
const TICK = 20;

type Size = { width: number; height: number };

export type HeroAlgorithmInfo = { id: string; name: string };

/** Display facts about a hero palette; `param` is null for 1-bit. */
export type HeroPaletteInfo = {
  id: string;
  name: string;
  colors: number;
  param: string | null;
};

const pad = (value: number, length = 3) => String(value).padStart(length, "0");

/** Wraps an index into `0…length - 1`. */
const wrap = (index: number, length: number) =>
  ((index % length) + length) % length;

/**
 * The landing's before/after instrument: the sample image, pre-rendered for
 * every algorithm × palette pair, behind a keyboard-operable divider. Two
 * steppers walk through the algorithms and the palettes. Rulers tick every
 * 20 pixels of the processing resolution and the readout follows the
 * pointer in those pixels.
 */
export function HeroInstrument({
  algorithms,
  palettes,
  variantPattern,
  size,
  original,
}: {
  // Everything comes in as data so the client bundle doesn't carry the
  // algorithm and palette catalogs. The first of each list is shown first.
  algorithms: HeroAlgorithmInfo[];
  palettes: HeroPaletteInfo[];
  /** Image path with `{algorithm}` and `{palette}` placeholders. */
  variantPattern: string;
  /** Processing size of every variant; the hero shows them 1:1. */
  size: Size;
  original: { src: string };
}) {
  const [algorithmIndex, setAlgorithmIndex] = useState(0);
  const [paletteIndex, setPaletteIndex] = useState(0);
  const [point, setPoint] = useState<{ x: number; y: number } | null>(null);

  const algorithm = algorithms[algorithmIndex];
  const palette = palettes[paletteIndex];
  // 1-bit is the default mode, not a palette: it isn't numbered or counted,
  // so the counter agrees with the palette count quoted across the site.
  const presets = palettes.filter((p) => p.param);
  const palettePosition = palette.param
    ? `${pad(presets.indexOf(palette) + 1, 2)}/${pad(presets.length, 2)}`
    : `--/${pad(presets.length, 2)}`;
  const variant = (a: number, p: number) =>
    variantPattern
      .replace("{algorithm}", algorithms[wrap(a, algorithms.length)].id)
      .replace("{palette}", palettes[wrap(p, palettes.length)].id);

  // Warm the cache with the neighbors, so a step swaps instantly.
  useEffect(() => {
    for (const [a, p] of [
      [algorithmIndex - 1, paletteIndex],
      [algorithmIndex + 1, paletteIndex],
      [algorithmIndex, paletteIndex - 1],
      [algorithmIndex, paletteIndex + 1],
    ]) {
      new window.Image().src = variant(a, p);
    }
    // `variant` only reads props that never change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [algorithmIndex, paletteIndex]);

  const editorLink =
    `/editor?sample=1&algorithm=${algorithm.id}` +
    (palette.param ? `&palette=${palette.param}` : "");

  return (
    <figure className="flex w-full max-w-124 min-w-0 flex-col gap-4 xl:justify-self-end">
      <div className="relative pt-3.5 pl-4">
        <div
          aria-hidden="true"
          className="ruler-x absolute top-0 right-0 left-4 h-1.5"
          style={{ "--ticks": size.width / TICK } as CSSProperties}
        />
        <div
          aria-hidden="true"
          className="ruler-y absolute top-3.5 bottom-0 left-0 w-1.5"
          style={{ "--ticks": size.height / TICK } as CSSProperties}
        />
        <div className="ring-line-strong ring-offset-ink ring-1 ring-offset-4">
          <CompareSlider
            before={{
              src: original.src,
              alt: "The sample image before dithering: a synthwave sunset, a striped sun over mountains and a neon grid",
            }}
            after={{
              src: variant(algorithmIndex, paletteIndex),
              alt: `The same image dithered with ${algorithm.name} ${palette.param ? `and the ${palette.name} palette` : "in 1-bit black and white"}, ${size.width} × ${size.height} pixels`,
            }}
            width={size.width}
            height={size.height}
            beforeSizes="(max-width: 640px) 100vw, 480px"
            // Shown 1:1 from sm up; smaller screens scale it down smoothly
            // (nearest-neighbor would add moiré).
            afterClassName="max-sm:image-smooth"
            onPointerPosition={setPoint}
          />
        </div>
        {/* Pointer readout, centered under the image: visual only, it tracks
            the mouse. The idle text has as many characters as a reading, so
            its (monospaced) width never changes. */}
        <p
          aria-hidden="true"
          className="text-readout text-paper mt-3 text-center whitespace-pre"
        >
          {point
            ? `X ${pad(Math.min(size.width - 1, Math.floor(point.x * size.width)))} · Y ${pad(Math.min(size.height - 1, Math.floor(point.y * size.height)))}`
            : "X --- · Y ---"}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Stepper
          label="Algorithm"
          noun="algorithm"
          value={algorithm.name}
          position={`${pad(algorithmIndex + 1, 2)}/${pad(algorithms.length, 2)}`}
          onStep={(step) =>
            setAlgorithmIndex((i) => wrap(i + step, algorithms.length))
          }
        />
        <Stepper
          label="Palette"
          noun="palette"
          value={palette.name}
          position={palettePosition}
          onStep={(step) =>
            setPaletteIndex((i) => wrap(i + step, palettes.length))
          }
        />
      </div>

      <figcaption className="text-readout text-paper-dim flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
        <Link
          href={editorLink}
          className="text-paper hover:text-paper-hot decoration-line-strong hover:decoration-paper-hot focus-visible:outline-safelight self-start underline underline-offset-4 outline-none focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          Open this look in the editor
        </Link>
        <span>
          {size.width} × {size.height} · {palette.colors} colors
        </span>
      </figcaption>
    </figure>
  );
}

const stepButton =
  "text-paper hover:text-paper-hot hover:border-paper border-line-strong focus-visible:outline-safelight grid size-11 shrink-0 place-items-center border transition-colors outline-none focus-visible:outline-2 focus-visible:outline-offset-2 [&_svg]:size-4";

/** `‹ value ›` with a position counter; steps wrap around the ends. */
function Stepper({
  label,
  noun,
  value,
  position,
  onStep,
}: {
  label: string;
  noun: string;
  value: string;
  /** Counter shown after the value, like `03/17`. */
  position: string;
  onStep: (step: -1 | 1) => void;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3"
    >
      <span aria-hidden="true" className="text-caps text-paper-dim sm:w-22">
        {label}
      </span>
      <div className="flex w-full min-w-0 items-center sm:flex-1">
        <button
          type="button"
          aria-label={`Previous ${noun}`}
          onClick={() => onStep(-1)}
          className={stepButton}
        >
          <ChevronLeft aria-hidden="true" />
        </button>
        <output
          aria-live="polite"
          className="border-line-strong bg-ink flex h-11 min-w-0 flex-1 items-center justify-between gap-3 border-y px-3"
        >
          <span className="truncate text-sm font-semibold">{value}</span>
          <span className="text-readout text-paper-dim shrink-0">
            {position}
          </span>
        </output>
        <button
          type="button"
          aria-label={`Next ${noun}`}
          onClick={() => onStep(1)}
          className={stepButton}
        >
          <ChevronRight aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
