"use client";

import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useEditorContext } from "@/contexts/editor-context";
import { useImageContext } from "@/contexts/image-context";
import { EditorState } from "@/lib/enum/editor-state";
import { useDebouncedCallback } from "use-debounce";

export function SliderScale() {
  const { baseImage, editorState } = useImageContext();
  const { ditherScale, setDitherScale, isRendering, handleRender } =
    useEditorContext();

  const scaledWidth = baseImage ? Math.round(baseImage.width * ditherScale) : 0;
  const scaledHeight = baseImage
    ? Math.round(baseImage.height * ditherScale)
    : 0;

  async function onValueCommit() {
    if (editorState === EditorState.Rendered) {
      await handleRender(true);
    }
  }

  const debouncedOnValueCommit = useDebouncedCallback(async () => {
    await onValueCommit();
  }, 10);

  function onDoubleClick() {
    if (ditherScale !== 1) {
      setDitherScale(1);
      debouncedOnValueCommit();
    }
  }
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <Label htmlFor="dither-scale" className="text-muted-foreground">
          Processing Scale
        </Label>
        <span className="text-muted-foreground hover:border-border w-12 rounded-md border border-transparent px-2 py-0.5 text-right text-xs">
          {baseImage && editorState !== EditorState.Initial
            ? `${(ditherScale * 100).toFixed(0)}%`
            : "-"}
        </span>
      </div>
      <div className="flex flex-col justify-center gap-1">
        <Slider
          id="dither-scale"
          aria-label="Processing scale"
          value={[ditherScale]}
          min={0.05}
          max={1}
          step={0.01}
          onValueChange={(value: number[]) => setDitherScale(value[0])}
          onValueCommit={onValueCommit}
          onDoubleClick={onDoubleClick}
          disabled={editorState === EditorState.Initial || isRendering}
          className={
            editorState === EditorState.Initial ? "cursor-not-allowed" : ""
          }
        />

        <span className="text-muted-foreground text-center text-xs">
          {baseImage && editorState !== EditorState.Initial
            ? `${scaledWidth} x ${scaledHeight}`
            : "-"}
        </span>
      </div>
    </div>
  );
}
