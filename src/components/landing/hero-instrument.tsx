"use client";

import { useState, type CSSProperties } from "react";
import Link from "next/link";
import { CompareSlider } from "@/components/compare-slider";
import type { HeroAlgorithm, HeroPalette } from "@/lib/samples";
import { cn } from "@/lib/utils";

/** Real pixels between two ruler ticks. */
const TICK = 20;

/** Display facts about a hero palette; `param` is null for 1-bit. */
export type HeroPaletteInfo = {
  id: HeroPalette;
  name: string;
  colors: number;
  param: string | null;
};

type Size = { width: number; height: number };

const pad = (value: number) => String(value).padStart(3, "0");

/**
 * The landing's before/after instrument: the sample image, pre-rendered for
 * every algorithm × palette pair, behind a keyboard-operable divider. Rulers
 * tick every 20 pixels of the 240×160 processing resolution and the readout
 * follows the pointer in those pixels.
 */
export function HeroInstrument({
  algorithms,
  palettes,
  variants,
  size,
  original,
}: {
  // Everything comes in as data so the client bundle doesn't carry the
  // algorithm and palette catalogs.
  algorithms: { id: HeroAlgorithm; name: string }[];
  palettes: HeroPaletteInfo[];
  /** Image of each pair, keyed `${algorithm}:${palette}`. */
  variants: Record<string, string>;
  size: Size;
  original: { src: string };
}) {
  const [algorithm, setAlgorithm] = useState(algorithms[0].id);
  const [palette, setPalette] = useState(palettes[0].id);
  const [point, setPoint] = useState<{ x: number; y: number } | null>(null);

  const info = palettes.find((p) => p.id === palette) ?? palettes[0];
  const algorithmName = (id: HeroAlgorithm) =>
    algorithms.find((a) => a.id === id)?.name ?? id;
  const editorLink =
    `/editor?sample=1&algorithm=${algorithm}` +
    (info.param ? `&palette=${info.param}` : "");

  return (
    <figure className="flex w-full min-w-0 flex-col gap-4">
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
              alt: "The sample image before dithering: a sunset over hills and a lake, a red sphere and a calibration strip",
            }}
            after={{
              src: variants[`${algorithm}:${palette}`],
              alt: `The same image dithered with ${algorithmName(algorithm)} and the ${info.name} palette, ${size.width} × ${size.height} pixels`,
            }}
            width={size.width}
            height={size.height}
            beforeSizes="(max-width: 1024px) 100vw, 540px"
            labels={{ before: "Before", after: "After" }}
            initial={50}
            onPointerPosition={setPoint}
          />
        </div>
      </div>

      <ChipRow
        label="Algorithm"
        options={algorithms.map((a) => [a.id, a.name] as const)}
        value={algorithm}
        onChange={setAlgorithm}
      />
      <ChipRow
        label="Palette"
        options={palettes.map((p) => [p.id, p.name] as const)}
        value={palette}
        onChange={setPalette}
      />

      <figcaption className="text-readout text-paper-dim flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        {/* Pointer readout: visual only, it tracks the mouse. */}
        <span aria-hidden="true" className="text-paper">
          {point
            ? `X ${pad(Math.min(size.width - 1, Math.floor(point.x * size.width)))} · Y ${pad(Math.min(size.height - 1, Math.floor(point.y * size.height)))}`
            : "X — · Y —"}
        </span>
        <span>
          {size.width} × {size.height} · {algorithmName(algorithm)} ·{" "}
          {info.name} · {info.colors} colors
        </span>
        <Link
          href={editorLink}
          className="text-paper hover:text-paper-hot decoration-line-strong hover:decoration-paper-hot focus-visible:outline-safelight underline underline-offset-4 outline-none focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          Open this look in the editor
        </Link>
      </figcaption>
    </figure>
  );
}

function ChipRow<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: (readonly [T, string])[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className="flex flex-wrap items-center gap-1.5"
    >
      <span aria-hidden="true" className="text-caps text-paper-dim w-22">
        {label}
      </span>
      {options.map(([id, name]) => (
        <button
          key={id}
          type="button"
          aria-pressed={id === value}
          onClick={() => onChange(id)}
          className={cn(
            "text-label focus-visible:outline-safelight h-8 border px-2.5 transition-colors outline-none focus-visible:outline-2 focus-visible:outline-offset-2",
            id === value
              ? "bg-paper text-ink border-paper"
              : "border-line-strong text-paper hover:border-paper",
          )}
        >
          {name}
        </button>
      ))}
    </div>
  );
}
