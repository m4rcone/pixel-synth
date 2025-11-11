"use client";

import { Dispatch, SetStateAction, useEffect, useRef } from "react";
import { useEditorContext } from "@/contexts/editor-context";
import { useImageContext } from "@/contexts/image-context";
import { EditorState } from "@/lib/enum/editor-state";
import { useDebouncedCallback } from "use-debounce";
import { ToneRange } from "@/lib/enum/tone-range";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Lock } from "lucide-react";

export function ToneControls() {
  const { editorState } = useImageContext();
  const {
    colorCount,
    setcolorCount,
    luminance,
    setLuminance,
    highlightsColor,
    setHighlightsColor,
    highlightsToneRange,
    setHighlightsToneRange,
    midtonesColor,
    setMidtonesColor,
    midtonesToneRange,
    setMidtonesToneRange,
    shadowsColor,
    setShadowsColor,
    shadowsToneRange,
    setShadowsToneRange,
    isRendering,
    handleRender,
  } = useEditorContext();

  useEffect(() => {
    if (editorState === EditorState.Rendered) {
      handleRender(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [colorCount, luminance]);

  async function onCommitColor() {
    if (editorState === EditorState.Rendered) {
      await handleRender(true);
    }
  }

  async function onCommitToneRange() {
    if (editorState === EditorState.Rendered) {
      await handleRender(true);
    }
  }

  const debouncedonCommitToneRange = useDebouncedCallback(async () => {
    await onCommitToneRange();
  }, 10);

  function onDoubleClick(toneRange: ToneRange) {
    if (toneRange === ToneRange.Midtones && midtonesToneRange !== 170) {
      setMidtonesToneRange(170);
      debouncedonCommitToneRange();
    }
    if (toneRange === ToneRange.Shadows && shadowsToneRange !== 85) {
      setShadowsToneRange(85);
      debouncedonCommitToneRange();
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Color count */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="tone-mapping" className="text-muted-foreground">
          Color Mode
        </Label>
        <div className="flex items-center gap-4">
          <Select
            value={colorCount.toString()}
            onValueChange={(value: string) => setcolorCount(Number(value))}
            disabled={editorState !== EditorState.Rendered || isRendering}
          >
            <SelectTrigger id="tone-mapping" className="w-full">
              <SelectValue placeholder="Select a quantity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 color</SelectItem>
              <SelectItem value="2">2 colors</SelectItem>
              <SelectItem value="3">3 colors</SelectItem>
            </SelectContent>
          </Select>
          {/* Luminance */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="luminance"
              checked={luminance}
              onCheckedChange={() => setLuminance((prev) => !prev)}
              disabled={editorState !== EditorState.Rendered || isRendering}
            />
            <Label htmlFor="luminance">Luminance</Label>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <ToneControl
          label={ToneRange.Highlights}
          color={highlightsColor}
          toneRange={highlightsToneRange}
          disabled={editorState !== EditorState.Rendered || isRendering}
          onChangeColor={setHighlightsColor}
          onCommitColor={onCommitColor}
          onChangeToneRange={setHighlightsToneRange}
          onCommitToneRange={onCommitToneRange}
          onDoubleClick={onDoubleClick}
        />
        <ToneControl
          label={ToneRange.Midtones}
          color={midtonesColor}
          toneRange={midtonesToneRange}
          disabled={
            editorState !== EditorState.Rendered ||
            isRendering ||
            colorCount < 2
          }
          onChangeColor={setMidtonesColor}
          onCommitColor={onCommitColor}
          onChangeToneRange={setMidtonesToneRange}
          onCommitToneRange={onCommitToneRange}
          onDoubleClick={onDoubleClick}
        />
        <ToneControl
          label={ToneRange.Shadows}
          color={shadowsColor}
          toneRange={shadowsToneRange}
          disabled={
            editorState !== EditorState.Rendered ||
            isRendering ||
            colorCount < 3
          }
          onChangeColor={setShadowsColor}
          onCommitColor={onCommitColor}
          onChangeToneRange={setShadowsToneRange}
          onCommitToneRange={onCommitToneRange}
          onDoubleClick={onDoubleClick}
        />
      </div>
    </div>
  );
}

function ToneControl({
  label,
  color,
  toneRange,
  disabled,
  onChangeColor,
  onCommitColor,
  onChangeToneRange,
  onCommitToneRange,
  onDoubleClick,
}: {
  label: ToneRange;
  color: string;
  toneRange: number;
  disabled: boolean;
  onChangeColor: Dispatch<SetStateAction<string>>;
  onCommitColor: () => Promise<void>;
  onChangeToneRange: Dispatch<SetStateAction<number>>;
  onCommitToneRange: () => Promise<void>;
  onDoubleClick: (toneRange: ToneRange) => void;
}) {
  const { editorState } = useImageContext();
  const lastColorRef = useRef(color);
  const hasChangedRef = useRef(false);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col">
        <div className="flex items-center justify-between">
          <Label htmlFor="contrast" className="text-muted-foreground">
            {label}
          </Label>

          <span className="text-muted-foreground hover:border-border w-12 rounded-md border border-transparent px-2 py-0.5 text-right text-xs">
            {editorState === EditorState.Initial ? (
              "-"
            ) : label !== ToneRange.Highlights ? (
              toneRange
            ) : (
              <span className="flex items-center gap-0.5">
                <Lock width={10} height={10} />
                {toneRange}
              </span>
            )}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Input
            type="color"
            value={color}
            onChange={(e) => {
              hasChangedRef.current = true;
              onChangeColor(e.target.value);
            }}
            onBlur={() => {
              if (hasChangedRef.current && lastColorRef.current !== color) {
                lastColorRef.current = color;
                hasChangedRef.current = false;
                onCommitColor();
              }
            }}
            disabled={disabled}
            className="h-6 w-10 border-none p-0 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-transparent"
          />
          <Slider
            value={[toneRange]}
            min={0}
            max={255}
            step={1}
            onValueChange={([v]) => onChangeToneRange(v)}
            onValueCommit={onCommitToneRange}
            onDoubleClick={() => onDoubleClick(label)}
            disabled={disabled || label === ToneRange.Highlights}
            className={
              disabled || label === ToneRange.Highlights
                ? "cursor-not-allowed"
                : ""
            }
          />
        </div>
      </div>
    </div>
  );
}
