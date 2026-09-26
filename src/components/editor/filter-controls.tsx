"use client";

import { useEditorActions, useEditorState } from "@/contexts/editor-context";
import {
  DEFAULT_FILTERS,
  FILTER_LIMITS,
  type Filters,
} from "@/lib/editor/settings";
import { SliderField } from "./slider-field";

const FILTER_FIELDS: {
  key: keyof Filters;
  label: string;
  /** Maps the stored value to the displayed one (brightness is centered on 1). */
  display?: (value: number) => number;
}[] = [
  { key: "contrast", label: "Contrast" },
  { key: "brightness", label: "Brightness", display: (v) => v - 1 },
  { key: "saturation", label: "Saturation", display: (v) => v - 1 },
  { key: "noise", label: "Noise" },
  { key: "blur", label: "Blur" },
];

export function FilterControls() {
  const { status, settings } = useEditorState();
  const { update, commit } = useEditorActions();
  const disabled = status === "empty";

  // Filters preview immediately, even before dithering is applied.
  const setFilter =
    (key: keyof Filters, value: number) =>
    ({ filters }: { filters: Filters }) => ({
      filters: { ...filters, [key]: value },
    });

  return (
    <div className="flex flex-col gap-3">
      {FILTER_FIELDS.map(({ key, label, display = (v) => v }) => (
        <SliderField
          key={key}
          id={`filter-${key}`}
          label={label}
          value={settings.filters[key]}
          defaultValue={DEFAULT_FILTERS[key]}
          min={FILTER_LIMITS[key].min}
          max={FILTER_LIMITS[key].max}
          step={0.01}
          disabled={disabled}
          format={(v) => display(v).toFixed(2)}
          onChange={(value) => update(setFilter(key, value))}
          onCommit={(value) => commit(setFilter(key, value))}
        />
      ))}
    </div>
  );
}
