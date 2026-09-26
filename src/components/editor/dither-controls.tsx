"use client";

import { useState } from "react";
import { Grid2x2 } from "lucide-react";
import { useEditorActions, useEditorState } from "@/contexts/editor-context";
import { algorithmsByCategory, isAlgorithmId } from "@/lib/algorithms";
import {
  DEFAULT_SETTINGS,
  MIN_SCALE,
  type DitherChoice,
} from "@/lib/editor/settings";
import { usePixelArtPreset } from "@/hooks/use-pixel-art-preset";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SliderField } from "./slider-field";

const CATEGORIES = algorithmsByCategory();
const isDitherChoice = (value: string): value is DitherChoice =>
  value === "none" || isAlgorithmId(value);

export function DitherControls() {
  const { status, source, settings } = useEditorState();
  const { update, commit } = useEditorActions();
  const applyPixelArt = usePixelArtPreset();
  const disabled = status === "empty";
  // Algorithm and scale only affect the output once dithering is applied.
  const apply = status === "dithered" ? commit : update;
  const sourceWidth = source?.pixels.width ?? 0;
  const sourceHeight = source?.pixels.height ?? 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor="algorithm" className="text-label text-paper-dim">
            Algorithm
          </Label>
          <Button
            variant="ghost"
            size="sm"
            className="-mr-2 h-7 px-2 text-xs"
            disabled={disabled}
            onClick={applyPixelArt}
          >
            <Grid2x2 aria-hidden="true" />
            Pixel art preset
          </Button>
        </div>
        <Select
          value={settings.algorithm}
          onValueChange={(value) => {
            if (isDitherChoice(value)) apply({ algorithm: value });
          }}
          disabled={disabled}
        >
          <SelectTrigger id="algorithm" className="w-full">
            <SelectValue placeholder="Select an algorithm" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((category) => (
              <SelectGroup key={category.id}>
                <SelectLabel>{category.name}</SelectLabel>
                {category.algorithms.map((algorithm) => (
                  <SelectItem key={algorithm.slug} value={algorithm.slug}>
                    {algorithm.shortName}
                  </SelectItem>
                ))}
              </SelectGroup>
            ))}
            <SelectGroup>
              <SelectLabel>No dithering</SelectLabel>
              <SelectItem value="none">None (nearest color)</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      <SliderField
        id="dither-scale"
        label="Processing scale"
        value={settings.scale}
        defaultValue={DEFAULT_SETTINGS.scale}
        min={MIN_SCALE}
        max={1}
        step={0.01}
        disabled={disabled}
        format={(v) => `${Math.round(v * 100)}%`}
        onChange={(scale) => update({ scale })}
        onCommit={(scale) => apply({ scale })}
      />

      {source && (
        <WidthField
          // Remount when the scale changes elsewhere so the draft resyncs.
          key={`${sourceWidth}-${settings.scale}`}
          width={Math.max(1, Math.round(sourceWidth * settings.scale))}
          height={Math.max(1, Math.round(sourceHeight * settings.scale))}
          maxWidth={sourceWidth}
          disabled={disabled}
          onCommit={(width) =>
            apply({
              scale: Math.min(1, Math.max(MIN_SCALE, width / sourceWidth)),
            })
          }
        />
      )}
    </div>
  );
}

/** Output size in pixels; typing a width sets the processing scale. */
function WidthField({
  width,
  height,
  maxWidth,
  disabled,
  onCommit,
}: {
  width: number;
  height: number;
  maxWidth: number;
  disabled: boolean;
  onCommit: (width: number) => void;
}) {
  const [draft, setDraft] = useState(String(width));
  const minWidth = Math.max(1, Math.ceil(maxWidth * MIN_SCALE));

  function submit() {
    const value = Number.parseInt(draft, 10);
    if (!Number.isFinite(value)) {
      setDraft(String(width));
      return;
    }
    const clamped = Math.min(maxWidth, Math.max(minWidth, value));
    setDraft(String(clamped));
    if (clamped !== width) onCommit(clamped);
  }

  return (
    <div className="flex items-center gap-2">
      <Label
        htmlFor="output-width"
        className="text-label text-paper-dim mr-auto"
      >
        Output size
      </Label>
      <input
        id="output-width"
        type="number"
        inputMode="numeric"
        min={minWidth}
        max={maxWidth}
        value={draft}
        disabled={disabled}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={submit}
        onKeyDown={(event) => {
          if (event.key === "Enter") submit();
        }}
        aria-describedby="output-height"
        className="border-input text-readout focus-visible:ring-safelight h-8 w-20 rounded-md border bg-transparent px-2 text-right focus-visible:ring-2 focus-visible:outline-none"
      />
      <span id="output-height" className="text-readout text-paper-dim">
        × {height} px
      </span>
    </div>
  );
}
