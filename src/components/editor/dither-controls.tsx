"use client";

import { useState } from "react";
import { Grid2x2 } from "lucide-react";
import { useEditorActions, useEditorState } from "@/contexts/editor-context";
import {
  algorithmsByCategory,
  getAlgorithm,
  isAlgorithmId,
} from "@/lib/algorithms";
import {
  DEFAULT_SETTINGS,
  MIN_SCALE,
  SCREEN_LIMITS,
  type DitherChoice,
  type ScreenSettings,
  type ScreenShape,
} from "@/lib/editor/settings";
import { usePixelArtPreset } from "@/hooks/use-pixel-art-preset";
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
import { SliderField } from "./slider-field";

const CATEGORIES = algorithmsByCategory();
const SHAPES: { value: ScreenShape; label: string }[] = [
  { value: "round", label: "Round" },
  { value: "square", label: "Square" },
  { value: "diamond", label: "Diamond" },
];
/** Line Screen distances are in line spacings, so they scale with the screen. */
const lines = (value: number) =>
  `${Number.isInteger(value) ? value : value.toFixed(2)} ${value === 1 ? "line" : "lines"}`;
const isDitherChoice = (value: string): value is DitherChoice =>
  value === "none" || isAlgorithmId(value);

export function DitherControls() {
  const { status, source, settings } = useEditorState();
  const { update, commit } = useEditorActions();
  const applyPixelArt = usePixelArtPreset();
  const disabled = status === "empty";
  // Algorithm and scale only affect the output once dithering is applied.
  const apply = status === "dithered" ? commit : update;
  const category =
    settings.algorithm !== "none"
      ? getAlgorithm(settings.algorithm)?.category
      : undefined;
  const errorDiffusion = category === "error-diffusion";
  const setScreen = (set: typeof update, patch: Partial<ScreenSettings>) =>
    set(({ screen }) => ({ screen: { ...screen, ...patch } }));
  // Error diffusion reacts to every pixel, so small changes between frames
  // ripple across the whole pattern.
  const shimmers = !!source?.animation && errorDiffusion;
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
          <SelectTrigger
            id="algorithm"
            aria-describedby={shimmers ? "algorithm-hint" : undefined}
            className="w-full"
          >
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
        {shimmers && (
          <p
            id="algorithm-hint"
            className="text-paper-dim text-xs leading-relaxed"
          >
            Error diffusion can shimmer between frames; Bayer or Blue Noise stay
            stable.
          </p>
        )}
      </div>

      {errorDiffusion && (
        <SliderField
          id="dither-diffusion"
          label="Error diffusion"
          value={settings.diffusion}
          defaultValue={DEFAULT_SETTINGS.diffusion}
          min={0}
          max={1}
          step={0.01}
          disabled={disabled}
          format={(v) => `${Math.round(v * 100)}%`}
          onChange={(diffusion) => update({ diffusion })}
          onCommit={(diffusion) => apply({ diffusion })}
        />
      )}

      {category === "screen" && (
        <>
          <SliderField
            id="dither-screen-size"
            label="Screen size"
            value={settings.screen.size}
            defaultValue={DEFAULT_SETTINGS.screen.size}
            min={SCREEN_LIMITS.size.min}
            max={SCREEN_LIMITS.size.max}
            step={1}
            disabled={disabled}
            format={(v) => `${v} px`}
            onChange={(size) => setScreen(update, { size })}
            onCommit={(size) => setScreen(apply, { size })}
          />
          <SliderField
            id="dither-screen-angle"
            label="Screen angle"
            value={settings.screen.angle}
            defaultValue={DEFAULT_SETTINGS.screen.angle}
            min={SCREEN_LIMITS.angle.min}
            max={SCREEN_LIMITS.angle.max}
            // Steps of 7.5° reach the classic angles: 0, 15, 22.5, 45, 75.
            step={7.5}
            disabled={disabled}
            format={(v) => `${v}°`}
            onChange={(angle) => setScreen(update, { angle })}
            onCommit={(angle) => setScreen(apply, { angle })}
          />
          {settings.algorithm === "line-screen" && (
            <>
              <SliderField
                id="dither-screen-displace"
                label="Displacement"
                value={settings.screen.displace}
                defaultValue={DEFAULT_SETTINGS.screen.displace}
                min={SCREEN_LIMITS.displace.min}
                max={SCREEN_LIMITS.displace.max}
                step={0.05}
                disabled={disabled}
                format={lines}
                onChange={(displace) => setScreen(update, { displace })}
                onCommit={(displace) => setScreen(apply, { displace })}
              />
              <SliderField
                id="dither-screen-wave"
                label="Wave"
                value={settings.screen.wave}
                defaultValue={DEFAULT_SETTINGS.screen.wave}
                min={SCREEN_LIMITS.wave.min}
                max={SCREEN_LIMITS.wave.max}
                step={0.05}
                disabled={disabled}
                format={lines}
                onChange={(wave) => setScreen(update, { wave })}
                onCommit={(wave) => setScreen(apply, { wave })}
              />
              {settings.screen.wave > 0 && (
                <SliderField
                  id="dither-screen-wavelength"
                  label="Wave length"
                  value={settings.screen.wavelength}
                  defaultValue={DEFAULT_SETTINGS.screen.wavelength}
                  min={SCREEN_LIMITS.wavelength.min}
                  max={SCREEN_LIMITS.wavelength.max}
                  step={1}
                  disabled={disabled}
                  format={lines}
                  onChange={(wavelength) => setScreen(update, { wavelength })}
                  onCommit={(wavelength) => setScreen(apply, { wavelength })}
                />
              )}
            </>
          )}
          {settings.algorithm === "halftone" && (
            <div className="flex flex-col gap-2">
              <span className="text-label text-paper-dim">Dot shape</span>
              <Segmented
                label="Dot shape"
                options={SHAPES}
                value={settings.screen.shape}
                onChange={(shape) => setScreen(apply, { shape })}
                disabled={disabled}
              />
            </div>
          )}
        </>
      )}

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
