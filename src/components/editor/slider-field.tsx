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

  const header = (
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
            className="text-paper-dim hover:text-paper-hot hover:bg-accent focus-visible:ring-safelight grid size-6 place-items-center transition-colors focus-visible:ring-2 focus-visible:outline-hidden"
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
  );

  const slider = (
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
  );

  return (
    <div className="flex flex-col gap-2">
      {leading ? (
        // The leading control (a color swatch) sits beside both the label
        // and the slider, so the field stays two short rows tall.
        <div className="flex items-center gap-3">
          {leading}
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            {header}
            {slider}
          </div>
        </div>
      ) : (
        <>
          {header}
          {slider}
        </>
      )}
      {hint && (
        <span className="text-paper-dim text-readout text-center">{hint}</span>
      )}
    </div>
  );
}
