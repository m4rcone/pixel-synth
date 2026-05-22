"use client";

import { Button } from "@/components/ui/button";
import { EditorState } from "@/lib/enum/editor-state";
import { useImageContext } from "@/contexts/image-context";
import { useEditorContext } from "@/contexts/editor-context";
import { DitherAlgorithm } from "@/lib/enum/dither-algorithm";
import { useCanvasContext } from "@/contexts/canvas-context";
import {
  DEFAULT_COLOR_COUNT,
  DEFAULT_COLORS,
  DEFAULT_FILTERS,
  DEFAULT_DITHER_SCALE,
  DEFAULT_TONE_RANGE,
} from "@/lib/editor/default-values";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { RotateCcw, Sparkles, Trash2 } from "lucide-react";

export function ControlPanelActions() {
  const {
    editorState,
    baseImage,
    setEditorState,
    setBaseImage,
    setProcessedImage,
  } = useImageContext();
  const {
    handleRender,
    setDitherScale,
    setDitherAlgorithm,
    setFilters,
    setcolorCount,
    setLuminance,
    setHighlightsColor,
    setMidtonesColor,
    setShadowsColor,
    setHighlightsToneRange,
    setMidtonesToneRange,
    setShadowsToneRange,
    isRendering,
  } = useEditorContext();
  const { setShowProcessed, setScaleZoom, setPosition } = useCanvasContext();

  function handleDiscard() {
    setEditorState(EditorState.Initial);
    setBaseImage(null);
    setProcessedImage(null);
    setShowProcessed(true);
    setScaleZoom(1);
    setDitherScale(DEFAULT_DITHER_SCALE);
    setDitherAlgorithm(DitherAlgorithm.FloydSteinberg);
    setFilters(DEFAULT_FILTERS);
    setcolorCount(DEFAULT_COLOR_COUNT);
    setLuminance(false);
    setHighlightsColor(DEFAULT_COLORS.highlights);
    setMidtonesColor(DEFAULT_COLORS.midtones);
    setShadowsColor(DEFAULT_COLORS.shadows);
    setHighlightsToneRange(DEFAULT_TONE_RANGE.highlights);
    setMidtonesToneRange(DEFAULT_TONE_RANGE.midtones);
    setShadowsToneRange(DEFAULT_TONE_RANGE.shadows);
  }

  function handleReset() {
    setShowProcessed(true);
    setDitherAlgorithm(DitherAlgorithm.FloydSteinberg);
    setDitherScale(DEFAULT_DITHER_SCALE);
    setFilters(DEFAULT_FILTERS);
    setcolorCount(DEFAULT_COLOR_COUNT);
    setScaleZoom(1);
    setPosition({ x: 0, y: 0 });
    setLuminance(false);
    setHighlightsColor(DEFAULT_COLORS.highlights);
    setMidtonesColor(DEFAULT_COLORS.midtones);
    setShadowsColor(DEFAULT_COLORS.shadows);
    setHighlightsToneRange(DEFAULT_TONE_RANGE.highlights);
    setMidtonesToneRange(DEFAULT_TONE_RANGE.midtones);
    setShadowsToneRange(DEFAULT_TONE_RANGE.shadows);
    setEditorState(EditorState.Uploaded);
    setProcessedImage(baseImage);
  }

  return (
    <div className="flex min-h-[39.5px] w-full items-center">
      {editorState !== EditorState.Rendered && (
        <Button
          onClick={() => handleRender(true)}
          disabled={editorState === EditorState.Initial || isRendering}
          className="font-mono flex flex-1 items-center justify-center gap-1.5 text-xs tracking-[0.12em] uppercase"
        >
          <Sparkles className="h-4 w-4" />
          Apply Dither
        </Button>
      )}

      {editorState === EditorState.Rendered && (
        <div className="flex w-full gap-2">
          {/* AlertDialog Discard */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                disabled={isRendering}
                className="font-mono flex flex-1 items-center justify-center gap-1.5 text-xs tracking-[0.12em] uppercase"
              >
                <Trash2 className="h-4 w-4" />
                Discard
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Discard changes?</AlertDialogTitle>
                <AlertDialogDescription>
                  All adjustments and the processed image will be lost. This
                  action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDiscard}
                  className="bg-destructive text-white hover:bg-destructive/90"
                >
                  Confirm
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* AlertDialog Reset */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                disabled={isRendering}
                className="font-mono flex flex-1 items-center justify-center gap-1.5 text-xs tracking-[0.12em] uppercase"
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reset adjustments?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will revert all dither, filters and tone settings to
                  their defaults, but keep the image loaded.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleReset}>
                  Confirm
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </div>
  );
}
