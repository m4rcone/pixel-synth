"use client";

import { useEditorActions, useEditorState } from "@/contexts/editor-context";
import { algorithmsByCategory, isAlgorithmId } from "@/lib/algorithms";
import { DEFAULT_SETTINGS } from "@/lib/editor/settings";
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

export function DitherControls() {
  const { status, source, settings } = useEditorState();
  const { update, commit } = useEditorActions();
  const disabled = status === "empty";
  // Algorithm and scale only affect the output once dithering is applied.
  const apply = status === "dithered" ? commit : update;

  const outputSize = source
    ? `${Math.round(source.width * settings.scale)} × ${Math.round(source.height * settings.scale)} px`
    : undefined;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="algorithm" className="text-label text-paper-dim">
          Algorithm
        </Label>
        <Select
          value={settings.algorithm}
          onValueChange={(value) => {
            if (isAlgorithmId(value)) apply({ algorithm: value });
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
          </SelectContent>
        </Select>
      </div>

      <SliderField
        id="dither-scale"
        label="Processing scale"
        value={settings.scale}
        defaultValue={DEFAULT_SETTINGS.scale}
        min={0.05}
        max={1}
        step={0.01}
        disabled={disabled}
        format={(v) => `${Math.round(v * 100)}%`}
        hint={disabled ? undefined : outputSize}
        onChange={(scale) => update({ scale })}
        onCommit={(scale) => apply({ scale })}
      />
    </div>
  );
}
