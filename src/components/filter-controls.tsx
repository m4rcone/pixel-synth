"use client";

import { useEditorContext } from "@/contexts/editor-context";
import { useImageContext } from "@/contexts/image-context";
import { EditorState } from "@/lib/enum/editor-state";
import { useDebouncedCallback } from "use-debounce";
import { Filter } from "@/lib/enum/filter";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

export function FilterControls() {
  const { editorState } = useImageContext();
  const { filters, isRendering, setFilters, handleRender } = useEditorContext();

  async function onValueCommit() {
    if (editorState === EditorState.Rendered) {
      await handleRender(true);
    } else {
      await handleRender(false);
    }
  }

  const debouncedOnValueCommit = useDebouncedCallback(async () => {
    await onValueCommit();
  }, 10);

  function onDoubleClick(filter: Filter) {
    if (filter === Filter.Brightness && filters[filter] !== 1) {
      setFilters((prev) => ({ ...prev, [filter]: 1 }));
      debouncedOnValueCommit();
    }
    if (filter !== Filter.Brightness && filters[filter] !== 0) {
      setFilters((prev) => ({ ...prev, [filter]: 0 }));
      debouncedOnValueCommit();
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Contrast */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="contrast" className="font-mono text-[10px] tracking-[0.16em] text-[var(--paper-dim)] uppercase">
            Contrast
          </Label>
          <span className="font-mono text-muted-foreground hover:border-border w-12 rounded-md border border-transparent px-2 py-0.5 text-right text-xs tabular-nums">
            {editorState === EditorState.Initial
              ? "-"
              : filters.contrast.toFixed(2)}
          </span>
        </div>
        <Slider
          id="contrast"
          aria-label="Contrast"
          value={[filters.contrast]}
          min={-1}
          max={1}
          step={0.01}
          onValueChange={(value) =>
            setFilters((prev) => ({
              ...prev,
              [Filter.Contrast]: value[0],
            }))
          }
          onValueCommit={onValueCommit}
          onDoubleClick={() => onDoubleClick(Filter.Contrast)}
          disabled={editorState === EditorState.Initial || isRendering}
          className={
            editorState === EditorState.Initial ? "cursor-not-allowed" : ""
          }
        />
      </div>
      {/* Brightness */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="brightness" className="font-mono text-[10px] tracking-[0.16em] text-[var(--paper-dim)] uppercase">
            Brightness
          </Label>
          <span className="font-mono text-muted-foreground hover:border-border w-12 rounded-md border border-transparent px-2 py-0.5 text-right text-xs tabular-nums">
            {editorState === EditorState.Initial
              ? "-"
              : (filters.brightness - 1).toFixed(2)}
          </span>
        </div>
        <Slider
          id="brightness"
          aria-label="Brightness"
          value={[filters.brightness]}
          min={0}
          max={2}
          step={0.01}
          onValueChange={(value) =>
            setFilters((prev) => ({
              ...prev,
              [Filter.Brightness]: value[0],
            }))
          }
          onValueCommit={onValueCommit}
          onDoubleClick={() => onDoubleClick(Filter.Brightness)}
          disabled={editorState === EditorState.Initial || isRendering}
          className={
            editorState === EditorState.Initial ? "cursor-not-allowed" : ""
          }
        />
      </div>
      {/* Noise */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="noise" className="font-mono text-[10px] tracking-[0.16em] text-[var(--paper-dim)] uppercase">
            Noise
          </Label>
          <span className="font-mono text-muted-foreground hover:border-border w-12 rounded-md border border-transparent px-2 py-0.5 text-right text-xs tabular-nums">
            {editorState === EditorState.Initial
              ? "-"
              : filters.noise.toFixed(2)}
          </span>
        </div>
        <Slider
          id="noise"
          aria-label="Noise"
          value={[filters.noise]}
          min={0}
          max={1}
          step={0.01}
          onValueChange={(value) =>
            setFilters((prev) => ({
              ...prev,
              [Filter.Noise]: value[0],
            }))
          }
          onValueCommit={onValueCommit}
          onDoubleClick={() => onDoubleClick(Filter.Noise)}
          disabled={editorState === EditorState.Initial || isRendering}
          className={
            editorState === EditorState.Initial ? "cursor-not-allowed" : ""
          }
        />
      </div>
      {/* Blur */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="blur" className="font-mono text-[10px] tracking-[0.16em] text-[var(--paper-dim)] uppercase">
            Blur
          </Label>
          <span className="font-mono text-muted-foreground hover:border-border w-12 rounded-md border border-transparent px-2 py-0.5 text-right text-xs tabular-nums">
            {editorState === EditorState.Initial
              ? "-"
              : filters.blur.toFixed(2)}
          </span>
        </div>
        <Slider
          id="blur"
          aria-label="Blur"
          value={[filters.blur]}
          min={0}
          max={5}
          step={0.01}
          onValueChange={(value) =>
            setFilters((prev) => ({
              ...prev,
              [Filter.Blur]: value[0],
            }))
          }
          onValueCommit={onValueCommit}
          onDoubleClick={() => onDoubleClick(Filter.Blur)}
          disabled={editorState === EditorState.Initial || isRendering}
          className={
            editorState === EditorState.Initial ? "cursor-not-allowed" : ""
          }
        />
      </div>
    </div>
  );
}
