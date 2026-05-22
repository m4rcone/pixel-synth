import { useCanvasContext } from "@/contexts/canvas-context";
import { useImageContext } from "@/contexts/image-context";
import { EditorState } from "@/lib/enum/editor-state";
import { Eye, EyeClosed, RotateCcw, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "./ui/button";
import { SaveButton } from "./save-button";

type CanvasControllerProps = {
  onStatusChange?: (message: string) => void;
};

export function CanvasController({ onStatusChange }: CanvasControllerProps) {
  const { editorState, processedImage, baseImage } = useImageContext();
  const { scaleZoom, setScaleZoom, showProcessed, setShowProcessed, setPosition } =
    useCanvasContext();

  const handleZoomIn = () => {
    const newScale = Math.min(scaleZoom * 1.2, 10); // Max 10x
    setScaleZoom(newScale);
    onStatusChange?.(`Zoom ${(newScale * 100).toFixed()}%.`);
  };

  const handleZoomOut = () => {
    const newScale = Math.max(scaleZoom / 1.2, 0.1); // Min 0.1x
    setScaleZoom(newScale);
    onStatusChange?.(`Zoom ${(newScale * 100).toFixed()}%.`);
  };

  const handleResetView = () => {
    setScaleZoom(1);
    setPosition({ x: 0, y: 0 });
    onStatusChange?.("Canvas view reset.");
  };

  const handleTogglePreview = () => {
    const nextShowProcessed = !showProcessed;
    setShowProcessed(nextShowProcessed);
    onStatusChange?.(
      nextShowProcessed ? "Showing processed image." : "Showing original image.",
    );
  };

  return (
    <div className="flex min-h-14 items-center justify-between border-t border-[var(--line)] px-6 lg:px-3">
      <span className="font-mono text-[10px] tracking-[0.16em] text-[var(--paper-dim)] uppercase tabular-nums">
        Zoom {(scaleZoom * 100).toFixed()}%
      </span>
      <div className="flex items-center gap-2">
        <SaveButton />
        <Button
          variant="outline"
          size="icon"
          aria-label="Show processed image"
          aria-pressed={showProcessed}
          disabled={!processedImage || processedImage === baseImage}
          onClick={handleTogglePreview}
        >
          {showProcessed ? <Eye aria-hidden="true" /> : <EyeClosed aria-hidden="true" />}
        </Button>
        <Button
          variant="outline"
          size="icon"
          aria-label="Zoom in"
          disabled={editorState === EditorState.Initial}
          onClick={handleZoomIn}
        >
          <ZoomIn aria-hidden="true" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          aria-label="Zoom out"
          disabled={editorState === EditorState.Initial}
          onClick={handleZoomOut}
        >
          <ZoomOut aria-hidden="true" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          aria-label="Reset view"
          disabled={editorState === EditorState.Initial}
          onClick={handleResetView}
        >
          <RotateCcw aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
