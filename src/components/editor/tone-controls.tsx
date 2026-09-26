"use client";

import { useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import { useEditorActions, useEditorState } from "@/contexts/editor-context";
import {
  DEFAULT_SETTINGS,
  orderedTones,
  type EditorSettings,
  type ToneSlot,
} from "@/lib/editor/settings";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SliderField } from "./slider-field";

const TONE_SLOTS: { slot: ToneSlot; label: string; minColors: 1 | 2 | 3 }[] = [
  { slot: "highlights", label: "Highlights", minColors: 1 },
  { slot: "midtones", label: "Midtones", minColors: 2 },
  { slot: "shadows", label: "Shadows", minColors: 3 },
];

function setTone(
  slot: ToneSlot,
  patch: Partial<EditorSettings["tones"][ToneSlot]>,
) {
  return ({ tones }: EditorSettings) => ({
    tones: { ...tones, [slot]: { ...tones[slot], ...patch } },
  });
}

/**
 * Moves a band's upper bound. With three colors the shadows and midtones
 * bounds can't cross: the value stops one step short (the slider's range
 * stays 0–255, as with the levels points).
 */
function setRange(slot: ToneSlot, range: number) {
  return (settings: EditorSettings) => {
    const { tones, colorCount } = settings;
    let limited = range;
    if (colorCount >= 3 && slot === "shadows") {
      limited = Math.max(0, Math.min(range, tones.midtones.range - 1));
    } else if (colorCount >= 3 && slot === "midtones") {
      limited = Math.max(range, tones.shadows.range + 1);
    }
    return setTone(slot, { range: limited })(settings);
  };
}

export function ToneControls() {
  const { status, settings } = useEditorState();
  const { update, commit } = useEditorActions();
  // Tone mapping colors the dithered output, so it needs a dithered image.
  const disabled = status !== "dithered";

  // Native color pickers fire continuously while dragging; render once they settle.
  const commitColor = useDebouncedCallback(() => commit(), 150);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="tone-color-count" className="text-label text-paper-dim">
          Dot colors
        </Label>
        <Select
          value={String(settings.colorCount)}
          onValueChange={(value) =>
            commit(({ tones }) => {
              const colorCount = Number(value) as 1 | 2 | 3;
              // A third band needs shadows below midtones.
              return colorCount === 3
                ? { colorCount, tones: orderedTones(tones) }
                : { colorCount };
            })
          }
          disabled={disabled}
        >
          <SelectTrigger
            id="tone-color-count"
            aria-describedby="tone-color-count-hint"
            className="w-full"
          >
            <SelectValue placeholder="Select a quantity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">1 color</SelectItem>
            <SelectItem value="2">2 colors</SelectItem>
            <SelectItem value="3">3 colors</SelectItem>
          </SelectContent>
        </Select>
        <p
          id="tone-color-count-hint"
          className="text-paper-dim text-xs leading-relaxed"
        >
          Lit dots take the color of their brightness band.
        </p>
      </div>

      <BackgroundField
        background={settings.background}
        disabled={disabled}
        onPick={(background) => {
          update({ background });
          commitColor();
        }}
        onBackground={(background) => commit({ background })}
      />

      {TONE_SLOTS.map(({ slot, label, minColors }) => {
        const tone = settings.tones[slot];
        const slotDisabled = disabled || settings.colorCount < minColors;
        const colorId = `tone-${slot}-color`;

        return (
          <SliderField
            key={slot}
            id={`tone-${slot}-range`}
            label={label}
            value={tone.range}
            defaultValue={DEFAULT_SETTINGS.tones[slot].range}
            min={0}
            max={255}
            step={1}
            disabled={slotDisabled}
            locked={slot === "highlights"}
            format={(v) => String(v)}
            onChange={(range) => update(setRange(slot, range))}
            onCommit={(range) => commit(setRange(slot, range))}
            leading={
              <>
                <label htmlFor={colorId} className="sr-only">
                  {label} color
                </label>
                <input
                  id={colorId}
                  type="color"
                  value={tone.color.toLowerCase()}
                  disabled={slotDisabled}
                  onChange={(event) => {
                    update(setTone(slot, { color: event.target.value }));
                    commitColor();
                  }}
                  className="border-line-strong h-6 w-10 shrink-0 cursor-pointer rounded-sm border bg-transparent p-0.5 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </>
            }
          />
        );
      })}
    </div>
  );
}

/** Color of the "off" pixels, or transparent to lay the dither over other art. */
function BackgroundField({
  background,
  disabled,
  onPick,
  onBackground,
}: {
  background: string | null;
  disabled: boolean;
  /** While a color is being picked (renders once it settles). */
  onPick: (color: string) => void;
  onBackground: (background: string | null) => void;
}) {
  // Unchecking "Transparent" brings back the color it replaced (remembered
  // when it was checked, so a reset in between still restores the default).
  const [lastColor, setLastColor] = useState(
    background ?? DEFAULT_SETTINGS.background ?? "#000000",
  );
  const transparent = background === null;
  return (
    <div className="flex items-center gap-3">
      <Label htmlFor="tone-background" className="text-label text-paper-dim">
        Background
      </Label>
      <input
        id="tone-background"
        type="color"
        value={(background ?? lastColor).toLowerCase()}
        disabled={disabled || transparent}
        onChange={(event) => onPick(event.target.value)}
        className="border-line-strong h-6 w-10 shrink-0 cursor-pointer rounded-sm border bg-transparent p-0.5 disabled:cursor-not-allowed disabled:opacity-50"
      />
      <div className="ml-auto flex items-center gap-2">
        <Checkbox
          id="tone-transparent"
          checked={transparent}
          onCheckedChange={(checked) => {
            if (checked === true && background) setLastColor(background);
            onBackground(checked === true ? null : lastColor);
          }}
          disabled={disabled}
        />
        <Label htmlFor="tone-transparent">Transparent</Label>
      </div>
    </div>
  );
}
