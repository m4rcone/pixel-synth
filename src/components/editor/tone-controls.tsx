"use client";

import { useDebouncedCallback } from "use-debounce";
import { useEditorActions, useEditorState } from "@/contexts/editor-context";
import {
  DEFAULT_SETTINGS,
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

export function ToneControls() {
  const { status, settings } = useEditorState();
  const { update, commit } = useEditorActions();
  // Tone mapping colors the dithered output, so it needs a dithered image.
  const disabled = status !== "dithered";

  // Native color pickers fire continuously while dragging; render once they settle.
  const commitColor = useDebouncedCallback(() => commit(), 150);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-end gap-4">
        <div className="flex flex-1 flex-col gap-2">
          <Label
            htmlFor="tone-color-count"
            className="text-label text-paper-dim"
          >
            Color mode
          </Label>
          <Select
            value={String(settings.colorCount)}
            onValueChange={(value) =>
              commit({ colorCount: Number(value) as 1 | 2 | 3 })
            }
            disabled={disabled}
          >
            <SelectTrigger id="tone-color-count" className="w-full">
              <SelectValue placeholder="Select a quantity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 color</SelectItem>
              <SelectItem value="2">2 colors</SelectItem>
              <SelectItem value="3">3 colors</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex h-9 items-center gap-2">
          <Checkbox
            id="tone-luminance"
            checked={settings.preserveLuminance}
            onCheckedChange={(checked) =>
              commit({ preserveLuminance: checked === true })
            }
            disabled={disabled}
          />
          <Label htmlFor="tone-luminance">Luminance</Label>
        </div>
      </div>

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
            onChange={(range) => update(setTone(slot, { range }))}
            onCommit={(range) => commit(setTone(slot, { range }))}
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
