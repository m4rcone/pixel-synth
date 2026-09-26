"use client";

import { Pipette, Plus, SwatchBook, X } from "lucide-react";
import { useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import { useEditorActions, useEditorState } from "@/contexts/editor-context";
import type { ColorSettings } from "@/lib/editor/settings";
import {
  DYNAMIC_PALETTES,
  defaultMatch,
  getPalettePreset,
  isPaletteId,
  MAX_PALETTE_COLORS,
  MIN_PALETTE_COLORS,
  PALETTE_GROUPS,
  PALETTE_PRESETS,
  type PaletteMatch,
} from "@/lib/palettes";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Segmented } from "@/components/ui/segmented";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CmykControls } from "./cmyk-controls";
import { PaletteImport } from "./palette-import";
import { SliderField } from "./slider-field";
import { ToneControls } from "./tone-controls";

const MODES = [
  { value: "mono", label: "1-bit" },
  { value: "palette", label: "Palette" },
  { value: "cmyk", label: "CMYK" },
] as const;

const MATCHES = [
  { value: "color", label: "Color" },
  { value: "brightness", label: "Brightness" },
] as const;

const MATCH_HINTS: Record<PaletteMatch, string> = {
  color: "Each pixel takes the closest palette color. Best for many hues.",
  brightness:
    "Image brightness runs through the palette from darkest to lightest. Best for single-hue palettes.",
};

const PALETTE_OPTIONS = PALETTE_GROUPS.map((group) => ({
  group,
  items: [
    ...PALETTE_PRESETS.filter((p) => p.group === group).map((p) => ({
      id: p.id,
      name: p.name,
      colors: p.colors as readonly string[],
    })),
    ...DYNAMIC_PALETTES.filter((p) => p.group === group).map((p) => ({
      id: p.id,
      name: p.name,
      colors: [] as readonly string[],
    })),
  ],
}));

/**
 * The Color section: monochrome (1-bit + tone mapping), dither to a palette,
 * or CMYK process inks.
 */
export function ColorControls() {
  const { status, settings } = useEditorState();
  const { update, commit } = useEditorActions();
  const disabled = status === "empty";
  const apply = status === "dithered" ? commit : update;
  const setColor = (patch: Partial<ColorSettings>) =>
    apply(({ color }) => ({ color: { ...color, ...patch } }));

  return (
    <div className="flex flex-col gap-4">
      <Segmented
        label="Color mode"
        options={MODES}
        value={settings.color.mode}
        onChange={(mode) => setColor({ mode })}
        disabled={disabled}
      />
      {settings.color.mode === "mono" ? (
        <ToneControls />
      ) : settings.color.mode === "cmyk" ? (
        <CmykControls />
      ) : (
        <PaletteControls disabled={disabled} setColor={setColor} />
      )}
    </div>
  );
}

function PaletteControls({
  disabled,
  setColor,
}: {
  disabled: boolean;
  setColor: (patch: Partial<ColorSettings>) => void;
}) {
  const { status, settings, resultPalette } = useEditorState();
  const { update, commit } = useEditorActions();
  const { color } = settings;
  // Announces the last import; cleared once the colors are edited.
  const [imported, setImported] = useState("");

  // Colors to show: the preset, the custom list, or what the last render
  // extracted from the image.
  const shown =
    color.palette === "custom"
      ? color.custom
      : color.palette === "extracted"
        ? (resultPalette ?? [])
        : [...(getPalettePreset(color.palette)?.colors ?? [])];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="palette" className="text-label text-paper-dim">
          Palette
        </Label>
        <Select
          value={color.palette}
          onValueChange={(id) => {
            if (!isPaletteId(id)) return;
            setImported("");
            setColor({ palette: id, match: defaultMatch(id) });
          }}
          disabled={disabled}
        >
          <SelectTrigger id="palette" className="w-full">
            <SelectValue placeholder="Choose a palette" />
          </SelectTrigger>
          <SelectContent>
            {PALETTE_OPTIONS.map(({ group, items }) => (
              <SelectGroup key={group}>
                <SelectLabel>{group}</SelectLabel>
                {items.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    <span className="flex w-full items-center justify-between gap-3">
                      {item.name}
                      {item.colors.length > 0 && (
                        <SwatchStrip colors={item.colors} className="w-16" />
                      )}
                    </span>
                  </SelectItem>
                ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>
        {shown.length > 0 ? (
          <div className="flex flex-col gap-1">
            <SwatchStrip colors={shown} />
            <span className="text-readout text-paper-dim">
              {shown.length} colors
            </span>
          </div>
        ) : (
          <span className="text-paper-dim text-xs">
            Colors appear after the next render.
          </span>
        )}
      </div>

      {color.palette === "extracted" && (
        <SliderField
          id="extract-count"
          label="Colors"
          value={color.extractCount}
          defaultValue={8}
          min={MIN_PALETTE_COLORS}
          max={MAX_PALETTE_COLORS}
          step={1}
          disabled={disabled}
          format={(v) => String(v)}
          onChange={(extractCount) =>
            update(({ color }) => ({ color: { ...color, extractCount } }))
          }
          onCommit={(extractCount) => setColor({ extractCount })}
        />
      )}

      {color.palette === "custom" && (
        <CustomPaletteEditor
          colors={color.custom}
          disabled={disabled}
          onChange={(custom) => {
            setImported("");
            update(({ color }) => ({ color: { ...color, custom } }));
          }}
          onCommit={(custom) => {
            setImported("");
            setColor({ custom });
          }}
          render={status === "dithered" ? () => commit() : undefined}
        />
      )}

      <div className="flex flex-col gap-2">
        <span className="text-label text-paper-dim">Match by</span>
        <Segmented
          label="Match by"
          options={MATCHES}
          value={color.match}
          onChange={(match) => setColor({ match })}
          disabled={disabled}
        />
        <p className="text-paper-dim text-xs leading-relaxed">
          {MATCH_HINTS[color.match]}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap gap-2">
          {color.palette !== "extracted" && (
            <Button
              variant="outline"
              size="sm"
              disabled={disabled}
              onClick={() => {
                setImported("");
                setColor({ palette: "extracted", match: "color" });
              }}
            >
              <Pipette aria-hidden="true" />
              Extract from image
            </Button>
          )}
          {color.palette !== "custom" && (
            <Button
              variant="outline"
              size="sm"
              disabled={disabled || shown.length < MIN_PALETTE_COLORS}
              onClick={() =>
                setColor({
                  palette: "custom",
                  custom: shown.slice(0, MAX_PALETTE_COLORS),
                })
              }
            >
              <SwatchBook aria-hidden="true" />
              Edit colors
            </Button>
          )}
          <PaletteImport
            disabled={disabled}
            onImport={({ colors, name, found }) => {
              setColor({
                palette: "custom",
                custom: colors,
                match: defaultMatch("custom"),
              });
              setImported(
                `Imported ${colors.length} colors${name ? ` from ${name}` : ""}.` +
                  (found > colors.length
                    ? ` Kept the first ${colors.length} of ${found}.`
                    : ""),
              );
            }}
          />
        </div>
        {/* Always rendered, so screen readers track it before a message. */}
        <p role="status" className="text-paper-dim text-xs">
          {imported}
        </p>
      </div>
    </div>
  );
}

function CustomPaletteEditor({
  colors,
  disabled,
  onChange,
  onCommit,
  render,
}: {
  colors: string[];
  disabled: boolean;
  onChange: (colors: string[]) => void;
  onCommit: (colors: string[]) => void;
  /** Re-render after a color picker settles (only when already dithered). */
  render?: () => void;
}) {
  // Native color pickers fire continuously; render once they settle.
  const settle = useDebouncedCallback(() => render?.(), 150);

  return (
    <fieldset className="flex flex-col gap-2" disabled={disabled}>
      <legend className="text-label text-paper-dim mb-2">Custom colors</legend>
      <ul className="flex flex-wrap gap-1.5">
        {colors.map((color, index) => (
          <li key={index} className="group relative">
            <label className="sr-only" htmlFor={`custom-color-${index}`}>
              Color {index + 1}
            </label>
            <input
              id={`custom-color-${index}`}
              type="color"
              value={color}
              onChange={(event) => {
                const next = [...colors];
                next[index] = event.target.value;
                onChange(next);
                settle();
              }}
              className="border-line-strong block size-8 cursor-pointer rounded-sm border bg-transparent p-0.5 disabled:cursor-not-allowed"
            />
            {colors.length > MIN_PALETTE_COLORS && (
              <button
                type="button"
                onClick={() => onCommit(colors.filter((_, i) => i !== index))}
                aria-label={`Remove color ${index + 1}`}
                className="bg-ink-raised border-input text-paper-dim hover:text-paper focus-visible:ring-safelight absolute -top-1.5 -right-1.5 grid size-4 place-items-center rounded-full border opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:outline-none"
              >
                <X className="size-2.5" aria-hidden="true" />
              </button>
            )}
          </li>
        ))}
        {colors.length < MAX_PALETTE_COLORS && (
          <li>
            <button
              type="button"
              onClick={() => onCommit([...colors, colors.at(-1) ?? "#ffffff"])}
              aria-label="Add color"
              className="border-input text-paper-dim hover:text-paper hover:border-paper/60 focus-visible:ring-safelight grid size-8 place-items-center rounded-sm border border-dashed transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed"
            >
              <Plus className="size-4" aria-hidden="true" />
            </button>
          </li>
        )}
      </ul>
      <p className="text-paper-dim text-xs">
        Saved in this browser. {MIN_PALETTE_COLORS}–{MAX_PALETTE_COLORS} colors.
      </p>
    </fieldset>
  );
}

function SwatchStrip({
  colors,
  className,
}: {
  colors: readonly string[];
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={`flex h-3.5 overflow-hidden rounded-xs shadow-[inset_0_0_0_1px_var(--line-strong)] ${className ?? "w-full"}`}
    >
      {colors.map((color, index) => (
        <span key={index} className="flex-1" style={{ background: color }} />
      ))}
    </span>
  );
}
