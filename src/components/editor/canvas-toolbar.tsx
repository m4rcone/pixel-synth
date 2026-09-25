"use client";

import { Eye, EyeClosed, RotateCcw, ZoomIn, ZoomOut } from "lucide-react";
import {
  clampZoom,
  useCanvasContext,
  ZOOM_STEP,
} from "@/contexts/canvas-context";
import { useEditorState } from "@/contexts/editor-context";
import { Button } from "@/components/ui/button";
import { SaveButton } from "./save-button";

type CanvasToolbarProps = {
  onStatusChange?: (message: string) => void;
};

export function CanvasToolbar({ onStatusChange }: CanvasToolbarProps) {
  const { status, result } = useEditorState();
  const { zoom, setZoom, showProcessed, setShowProcessed, resetView } =
    useCanvasContext();
  const isEmpty = status === "empty";

  const zoomTo = (next: number) => {
    const clamped = clampZoom(next);
    setZoom(clamped);
    onStatusChange?.(`Zoom ${Math.round(clamped * 100)}%.`);
  };

  return (
    <div className="border-line flex min-h-14 items-center justify-between gap-2 border-t px-4 lg:px-3">
      <span className="text-label text-paper-dim tabular-nums">
        Zoom {Math.round(zoom * 100)}%
      </span>
      <div className="flex items-center gap-2">
        <SaveButton />
        <Button
          variant="outline"
          size="icon"
          aria-label="Show processed image"
          aria-pressed={showProcessed}
          disabled={!result}
          onClick={() => {
            setShowProcessed(!showProcessed);
            onStatusChange?.(
              showProcessed
                ? "Showing original image."
                : "Showing processed image.",
            );
          }}
        >
          {showProcessed ? (
            <Eye aria-hidden="true" />
          ) : (
            <EyeClosed aria-hidden="true" />
          )}
        </Button>
        <Button
          variant="outline"
          size="icon"
          aria-label="Zoom in"
          disabled={isEmpty}
          onClick={() => zoomTo(zoom * ZOOM_STEP)}
        >
          <ZoomIn aria-hidden="true" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          aria-label="Zoom out"
          disabled={isEmpty}
          onClick={() => zoomTo(zoom / ZOOM_STEP)}
        >
          <ZoomOut aria-hidden="true" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          aria-label="Reset view"
          disabled={isEmpty}
          onClick={() => {
            resetView();
            onStatusChange?.("Canvas view reset.");
          }}
        >
          <RotateCcw aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
