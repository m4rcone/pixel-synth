"use client";

import type { ReactNode } from "react";
import { Lock, RotateCcw } from "lucide-react";
import { Slider } from "@/components/ui/slider";

type SliderFieldProps = {
  id: string;
  label: string;
  value: number;
  defaultValue: number;
  min: number;
  max: number;
  step: number;
  disabled?: boolean;
  /** Shows the value but keeps the slider fixed (e.g. the highlights bound). */
  locked?: boolean;
  /** Rendered before the slider on the same row (e.g. a color swatch). */
  leading?: ReactNode;
  /** Formats the visible value readout and the slider's aria-valuetext. */
  format?: (value: number) => string;
  onChange: (value: number) => void;
  onCommit: (value: number) => void;
  /** Extra line under the slider (e.g. output dimensions). */
  hint?: string;
};

export function SliderField({
  id,
  label,
  value,
  defaultValue,
  min,
  max,
  step,
  disabled = false,
  locked = false,
  leading,
  format = (v) => v.toFixed(2),
  onChange,
  onCommit,
  hint,
}: SliderFieldProps) {
  const isDefault = value === defaultValue;
  const labelId = `${id}-label`;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex h-6 items-center justify-between gap-2">
        <span id={labelId} className="text-label text-paper-dim">
          {label}
        </span>
        <div className="-mr-1 flex items-center gap-0.5">
          {!disabled && !locked && !isDefault && (
            <button
              type="button"
              onClick={() => onCommit(defaultValue)}
              aria-label={`Reset ${label.toLowerCase()} to default`}
              className="text-paper-dim hover:text-paper hover:bg-accent focus-visible:ring-safelight grid size-6 place-items-center transition-colors focus-visible:ring-2 focus-visible:outline-hidden"
            >
              <RotateCcw className="size-3.5" aria-hidden="true" />
            </button>
          )}
          <output
            htmlFor={id}
            className="text-readout text-paper-dim pr-1 text-right"
          >
            {disabled ? (
              "–"
            ) : locked ? (
              <span className="inline-flex items-center gap-1">
                <Lock className="size-2.5" aria-hidden="true" />
                <span className="sr-only">Locked at</span>
                {format(value)}
              </span>
            ) : (
              format(value)
            )}
          </output>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {leading}
        <Slider
          id={id}
          aria-labelledby={labelId}
          aria-valuetext={format(value)}
          value={[value]}
          min={min}
          max={max}
          step={step}
          disabled={disabled || locked}
          onValueChange={([next]) => onChange(next)}
          onValueCommit={([next]) => onCommit(next)}
          onDoubleClick={() => !isDefault && onCommit(defaultValue)}
        />
      </div>
      {hint && (
        <span className="text-paper-dim text-center font-mono text-xs tabular-nums">
          {hint}
        </span>
      )}
    </div>
  );
}
