"use client";

import Konva from "konva";
import { useEffect, useRef, useState } from "react";
import { Stage, Layer, Image as ImageKonva } from "react-konva";
import { useCanvasContext } from "@/contexts/canvas-context";
import { useImageContext } from "@/contexts/image-context";

export function Canvas() {
  const [canvasDimensions, setCanvasDimensions] = useState({
    width: 0,
    height: 0,
  });

  const canvasRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<Konva.Image>(null);

  const { position, setPosition, scaleZoom, setScaleZoom, showProcessed } =
    useCanvasContext();
  const { baseImage, processedImage } = useImageContext();

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

    const newScale =
      e.evt.deltaY > 0
        ? Math.max(oldScale / 1.1, 0.1)
        : Math.min(oldScale * 1.1, 10);

    setScaleZoom(newScale);
    setPosition({
      x: pointer.x - mouseTo.x * newScale,
      y: pointer.y - mouseTo.y * newScale,
    });
  };

  return (
    <div
      ref={canvasRef}
      className="h-[300px] min-w-0 overflow-hidden md:h-[500px] lg:h-full"
    >
      {baseImage && canvasDimensions.width > 0 && (
        <Stage
          width={canvasDimensions.width}
          height={canvasDimensions.height}
          scaleX={scaleZoom}
          scaleY={scaleZoom}
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
              image={
                processedImage && showProcessed ? processedImage : baseImage
              }
              width={processedImage?.width ?? baseImage.width}
              height={processedImage?.height ?? baseImage.height}
            />
          </Layer>
        </Stage>
      )}
    </div>
  );
}
