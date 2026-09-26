"use client";

import { useEditorActions, useEditorState } from "@/contexts/editor-context";
import {
  DEFAULT_FILTERS,
  FILTER_LIMITS,
  type Filters,
} from "@/lib/editor/settings";
import { SliderField } from "./slider-field";

type FilterField = {
  key: keyof Filters;
  label: string;
  step?: number;
  /** Formats the stored value (brightness is shown centered on 0). */
  format?: (value: number) => string;
  /** Slider position ↔ stored value, for a slider that isn't linear. */
  scale?: {
    toSlider: (value: number) => number;
    fromSlider: (position: number) => number;
  };
  /**
   * Holds the value back from another filter (levels points can't cross).
   * Only the value is limited, never the slider's range, so its scale stays
   * put and it can always move away from the other point.
   */
  limit?: (value: number, filters: Filters) => number;
};

const decimals = (v: number) => v.toFixed(2);

// Gamma on a log scale, so 1 sits in the middle of 1/3 … 3.
const LOG_3 = Math.log(3);
const gammaScale = {
  // Rounded so the ends are exactly -1 and 1 (slider steps start there).
  toSlider: (gamma: number) =>
    Math.round((Math.log(gamma) / LOG_3) * 1e6) / 1e6,
  // Clamped: 1/3 would round to 0.33, below the limit (and off the slider).
  fromSlider: (position: number) =>
    Math.min(
      FILTER_LIMITS.gamma.max,
      Math.max(FILTER_LIMITS.gamma.min, Math.round(3 ** position * 100) / 100),
    ),
};

const FILTER_FIELDS: FilterField[] = [
  {
    key: "blackPoint",
    label: "Black point",
    step: 1,
    format: String,
    limit: (v, f) => Math.min(v, f.whitePoint - 1),
  },
  { key: "gamma", label: "Gamma", format: decimals, scale: gammaScale },
  {
    key: "whitePoint",
    label: "White point",
    step: 1,
    format: String,
    limit: (v, f) => Math.max(v, f.blackPoint + 1),
  },
  { key: "contrast", label: "Contrast" },
  {
    key: "brightness",
    label: "Brightness",
    format: (v) => decimals(v - 1),
  },
  {
    key: "saturation",
    label: "Saturation",
    format: (v) => decimals(v - 1),
  },
  { key: "sharpen", label: "Sharpen" },
  { key: "noise", label: "Noise" },
  { key: "blur", label: "Blur" },
];

const identity = { toSlider: (v: number) => v, fromSlider: (v: number) => v };

export function FilterControls() {
  const { status, settings } = useEditorState();
  const { update, commit } = useEditorActions();
  const disabled = status === "empty";

  // Filters preview immediately, even before dithering is applied. Limits
  // apply to the latest filters, as the update runs.
  const setFilter =
    (key: keyof Filters, value: number, limit?: FilterField["limit"]) =>
    ({ filters }: { filters: Filters }) => ({
      filters: { ...filters, [key]: limit ? limit(value, filters) : value },
    });

  return (
    <div className="flex flex-col gap-3">
      {FILTER_FIELDS.map(
        ({
          key,
          label,
          step = 0.01,
          format = decimals,
          scale = identity,
          limit,
        }) => (
          <SliderField
            key={key}
            id={`filter-${key}`}
            label={label}
            value={scale.toSlider(settings.filters[key])}
            defaultValue={scale.toSlider(DEFAULT_FILTERS[key])}
            min={scale.toSlider(FILTER_LIMITS[key].min)}
            max={scale.toSlider(FILTER_LIMITS[key].max)}
            step={step}
            disabled={disabled}
            format={(position) => format(scale.fromSlider(position))}
            onChange={(position) =>
              update(setFilter(key, scale.fromSlider(position), limit))
            }
            onCommit={(position) =>
              commit(setFilter(key, scale.fromSlider(position), limit))
            }
          />
        ),
      )}
    </div>
  );
}
