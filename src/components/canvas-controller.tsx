import { useCanvasContext } from "@/contexts/canvas-context";
import { useImageContext } from "@/contexts/image-context";
import { EditorState } from "@/lib/enum/editor-state";
import { Eye, EyeClosed, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "./ui/button";
import { SaveButton } from "./save-button";

export function CanvasController() {
  const { editorState, processedImage, baseImage } = useImageContext();
  const { scaleZoom, setScaleZoom, showProcessed, setShowProcessed } =
    useCanvasContext();

  const handleZoomIn = () => {
    const newScale = Math.min(scaleZoom * 1.2, 10); // Max 10x
    setScaleZoom(newScale);
  };

  const handleZoomOut = () => {
    const newScale = Math.max(scaleZoom / 1.2, 0.1); // Min 0.1x
    setScaleZoom(newScale);
  };

  return (
    <div className="flex min-h-14 items-center justify-between border-t px-6 lg:px-3">
      <span className="text-muted-foreground text-sm">
        Zoom: {(scaleZoom * 100).toFixed()}%
      </span>
      <div className="flex items-center gap-2">
        <SaveButton />
        <Button
          variant="outline"
          size="icon"
          disabled={!processedImage || processedImage === baseImage}
          onClick={() => setShowProcessed((prev) => !prev)}
        >
          {showProcessed ? <Eye /> : <EyeClosed />}
        </Button>
        <Button
          variant="outline"
          size="icon"
          disabled={editorState === EditorState.Initial}
          onClick={handleZoomIn}
        >
          <ZoomIn />
        </Button>
        <Button
          variant="outline"
          size="icon"
          disabled={editorState === EditorState.Initial}
          onClick={handleZoomOut}
        >
          <ZoomOut />
        </Button>
      </div>
    </div>
  );
}
