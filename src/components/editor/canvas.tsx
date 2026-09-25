"use client";

import Konva from "konva";
import { KeyboardEvent, useEffect, useRef, useState } from "react";
import { Stage, Layer, Image as ImageKonva } from "react-konva";
import {
  clampZoom,
  useCanvasContext,
  ZOOM_STEP,
} from "@/contexts/canvas-context";
import { useEditorState } from "@/contexts/editor-context";

type CanvasProps = {
  onStatusChange?: (message: string) => void;
};

const PAN_STEP = 25;
const LARGE_PAN_STEP = 100;

export function Canvas({ onStatusChange }: CanvasProps) {
  const [canvasDimensions, setCanvasDimensions] = useState({
    width: 0,
    height: 0,
  });

  const canvasRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<Konva.Image>(null);

  const { position, setPosition, zoom, setZoom, resetView, showProcessed } =
    useCanvasContext();
  const { source: baseImage, result: processedImage } = useEditorState();
  const displayedImage =
    processedImage && showProcessed ? processedImage : baseImage;

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;

    const parent = el.parentElement;
    const resizeObserver = new ResizeObserver(() => {
      const rect = el.getBoundingClientRect();
      setCanvasDimensions({
        width: rect.width,
        height: rect.height,
      });
    });

    resizeObserver.observe(el);
    if (parent) resizeObserver.observe(parent);

    const rect = el.getBoundingClientRect();
    setCanvasDimensions({ width: rect.width, height: rect.height });

    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    const canvases = canvasRef.current?.querySelectorAll("canvas");
    canvases?.forEach((canvas) => {
      canvas.setAttribute("aria-hidden", "true");
      canvas.setAttribute("role", "presentation");
    });
  }, [baseImage, canvasDimensions, displayedImage]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleWheel = (e: any) => {
    e.evt.preventDefault();

    const stage = e.target.getStage();
    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();

    const mouseTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    const newScale = clampZoom(
      e.evt.deltaY > 0 ? oldScale / 1.1 : oldScale * 1.1,
    );

    setZoom(newScale);
    setPosition({
      x: pointer.x - mouseTo.x * newScale,
      y: pointer.y - mouseTo.y * newScale,
    });
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const panStep = event.shiftKey ? LARGE_PAN_STEP : PAN_STEP;
    let handled = true;

    switch (event.key) {
      case "ArrowUp":
        setPosition((prev) => ({ ...prev, y: prev.y - panStep }));
        onStatusChange?.("Canvas panned up.");
        break;
      case "ArrowRight":
        setPosition((prev) => ({ ...prev, x: prev.x + panStep }));
        onStatusChange?.("Canvas panned right.");
        break;
      case "ArrowDown":
        setPosition((prev) => ({ ...prev, y: prev.y + panStep }));
        onStatusChange?.("Canvas panned down.");
        break;
      case "ArrowLeft":
        setPosition((prev) => ({ ...prev, x: prev.x - panStep }));
        onStatusChange?.("Canvas panned left.");
        break;
      case "+":
      case "=":
        {
          const newScale = clampZoom(zoom * ZOOM_STEP);
          setZoom(newScale);
          onStatusChange?.(`Zoom ${(newScale * 100).toFixed()}%.`);
        }
        break;
      case "-":
        {
          const newScale = clampZoom(zoom / ZOOM_STEP);
          setZoom(newScale);
          onStatusChange?.(`Zoom ${(newScale * 100).toFixed()}%.`);
        }
        break;
      case "0":
        resetView();
        onStatusChange?.("Canvas view reset.");
        break;
      default:
        handled = false;
    }

    if (handled) {
      event.preventDefault();
    }
  };

  return (
    <>
      {/* The Konva stage is a custom keyboard-operated canvas workspace. */}
      {/* eslint-disable jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/no-noninteractive-tabindex */}
      <div
        ref={canvasRef}
        role="application"
        aria-roledescription="interactive image canvas"
        tabIndex={0}
        aria-label={
          showProcessed && processedImage
            ? "Processed image canvas"
            : "Original image canvas"
        }
        aria-describedby="canvas-keyboard-instructions"
        onKeyDown={handleKeyDown}
        className="focus-visible:ring-ring h-[300px] min-w-0 overflow-hidden focus-visible:ring-2 focus-visible:outline-hidden md:h-[500px] lg:h-full"
      >
        <p id="canvas-keyboard-instructions" className="sr-only">
          Interactive image preview. Use arrow keys to pan, Shift plus arrow
          keys to pan farther, plus or equals to zoom in, minus to zoom out, and
          0 to reset the view.
        </p>
        {baseImage && canvasDimensions.width > 0 && (
          <Stage
            width={canvasDimensions.width}
            height={canvasDimensions.height}
            scaleX={zoom}
            scaleY={zoom}
            x={position.x}
            y={position.y}
            onWheel={handleWheel}
            draggable
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onDragEnd={(e: any) =>
              setPosition({ x: e.target.x(), y: e.target.y() })
            }
            className="cursor-grab"
          >
            <Layer>
              <ImageKonva
                ref={imageRef}
                image={displayedImage ?? baseImage}
                width={displayedImage?.width ?? baseImage.width}
                height={displayedImage?.height ?? baseImage.height}
              />
            </Layer>
          </Stage>
        )}
      </div>
      {/* eslint-enable jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/no-noninteractive-tabindex */}
    </>
  );
}
