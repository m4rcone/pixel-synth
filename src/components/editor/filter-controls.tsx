"use client";

import { useEditorActions, useEditorState } from "@/contexts/editor-context";
import { DEFAULT_FILTERS, type Filters } from "@/lib/editor/settings";
import { SliderField } from "./slider-field";

const FILTER_FIELDS: {
  key: keyof Filters;
  label: string;
  min: number;
  max: number;
  /** Maps the stored value to the displayed one (brightness is centered on 1). */
  display?: (value: number) => number;
}[] = [
  { key: "contrast", label: "Contrast", min: -1, max: 1 },
  {
    key: "brightness",
    label: "Brightness",
    min: 0,
    max: 2,
    display: (v) => v - 1,
  },
  { key: "noise", label: "Noise", min: 0, max: 1 },
  { key: "blur", label: "Blur", min: 0, max: 5 },
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
      {FILTER_FIELDS.map(({ key, label, min, max, display = (v) => v }) => (
        <SliderField
          key={key}
          id={`filter-${key}`}
          label={label}
          value={settings.filters[key]}
          defaultValue={DEFAULT_FILTERS[key]}
          min={min}
          max={max}
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
