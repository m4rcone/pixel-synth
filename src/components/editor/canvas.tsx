"use client";

import {
  type KeyboardEvent,
  type PointerEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  clampZoom,
  useCanvasContext,
  ZOOM_STEP,
  type Point,
} from "@/contexts/canvas-context";
import { useEditorState } from "@/contexts/editor-context";

type CanvasProps = {
  onStatusChange?: (message: string) => void;
};

const PAN_STEP = 25;
const LARGE_PAN_STEP = 100;
const WHEEL_ZOOM = 1.1;
/** Share of the viewport the image fills at zoom 100%. */
const FIT_PADDING = 0.92;

type Size = { width: number; height: number };

/**
 * Pan/zoom viewport for the editor image. Zoom 100% fits the image in the
 * view; `position` is the pan offset from that centered placement. Upscaled
 * pixels are drawn nearest-neighbor so dither patterns stay crisp.
 */
export function Canvas({ onStatusChange }: CanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointers = useRef(new Map<number, Point>());
  const pinchDistance = useRef<number | null>(null);
  const [view, setView] = useState<Size>({ width: 0, height: 0 });

  const { position, setPosition, zoom, setZoom, resetView, showProcessed } =
    useCanvasContext();
  const { source, result } = useEditorState();
  const image = (showProcessed && result) || source?.bitmap || null;

  const fit = image
    ? Math.min(view.width / image.width, view.height / image.height) *
      FIT_PADDING
    : 1;
  const scale = fit * zoom;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setView({ width, height });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(view.width * dpr);
    canvas.height = Math.round(view.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, view.width, view.height);
    if (!image) return;

    const width = image.width * scale;
    const height = image.height * scale;
    ctx.imageSmoothingEnabled = scale < 1;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(
      image,
      (view.width - width) / 2 + position.x,
      (view.height - height) / 2 + position.y,
      width,
      height,
    );
  }, [image, view, scale, position]);

  /** Zoom by `factor`, keeping the point under (x, y) fixed on screen. */
  function zoomAround(factor: number, x: number, y: number) {
    if (!image) return;
    const next = clampZoom(zoom * factor);
    const nextScale = fit * next;
    const left = (view.width - image.width * scale) / 2 + position.x;
    const top = (view.height - image.height * scale) / 2 + position.y;
    const u = (x - left) / scale;
    const v = (y - top) / scale;
    setZoom(next);
    setPosition({
      x: x - u * nextScale - (view.width - image.width * nextScale) / 2,
      y: y - v * nextScale - (view.height - image.height * nextScale) / 2,
    });
  }

  // Wheel listeners must be non-passive to prevent page scroll.
  const zoomAroundRef = useRef(zoomAround);
  useEffect(() => {
    zoomAroundRef.current = zoomAround;
  });
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const rect = el.getBoundingClientRect();
      zoomAroundRef.current(
        event.deltaY > 0 ? 1 / WHEEL_ZOOM : WHEEL_ZOOM,
        event.clientX - rect.left,
        event.clientY - rect.top,
      );
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    pointers.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    });
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    const previous = pointers.current.get(event.pointerId);
    if (!previous) return;
    const current = { x: event.clientX, y: event.clientY };
    pointers.current.set(event.pointerId, current);

    if (pointers.current.size === 2) {
      // Pinch to zoom around the midpoint of both fingers.
      const [a, b] = [...pointers.current.values()];
      const distance = Math.hypot(a.x - b.x, a.y - b.y);
      if (pinchDistance.current) {
        const rect = event.currentTarget.getBoundingClientRect();
        zoomAround(
          distance / pinchDistance.current,
          (a.x + b.x) / 2 - rect.left,
          (a.y + b.y) / 2 - rect.top,
        );
      }
      pinchDistance.current = distance;
      return;
    }

    setPosition((p) => ({
      x: p.x + current.x - previous.x,
      y: p.y + current.y - previous.y,
    }));
  }

  function handlePointerUp(event: PointerEvent<HTMLDivElement>) {
    pointers.current.delete(event.pointerId);
    pinchDistance.current = null;
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const step = event.shiftKey ? LARGE_PAN_STEP : PAN_STEP;
    const pan = (dx: number, dy: number, direction: string) => {
      setPosition((p) => ({ x: p.x + dx, y: p.y + dy }));
      onStatusChange?.(`Canvas panned ${direction}.`);
    };
    const zoomBy = (factor: number) => {
      const next = clampZoom(zoom * factor);
      setZoom(next);
      onStatusChange?.(`Zoom ${Math.round(next * 100)}%.`);
    };

    switch (event.key) {
      case "ArrowUp":
        pan(0, -step, "up");
        break;
      case "ArrowRight":
        pan(step, 0, "right");
        break;
      case "ArrowDown":
        pan(0, step, "down");
        break;
      case "ArrowLeft":
        pan(-step, 0, "left");
        break;
      case "+":
      case "=":
        zoomBy(ZOOM_STEP);
        break;
      case "-":
        zoomBy(1 / ZOOM_STEP);
        break;
      case "0":
        resetView();
        onStatusChange?.("Canvas view reset.");
        break;
      default:
        return;
    }
    event.preventDefault();
  }

  return (
    // A custom keyboard- and pointer-operated image workspace.
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <div
      ref={containerRef}
      role="application"
      aria-roledescription="interactive image canvas"
      // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
      tabIndex={0}
      aria-label={
        showProcessed && result
          ? "Processed image canvas"
          : "Original image canvas"
      }
      aria-describedby="canvas-keyboard-instructions"
      onKeyDown={handleKeyDown}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className="focus-visible:ring-ring relative h-[300px] min-w-0 cursor-grab touch-none overflow-hidden select-none focus-visible:ring-2 focus-visible:outline-hidden focus-visible:ring-inset active:cursor-grabbing md:h-[500px] lg:h-full"
    >
      <p id="canvas-keyboard-instructions" className="sr-only">
        Interactive image preview. Use arrow keys to pan, Shift plus arrow keys
        to pan farther, plus or equals to zoom in, minus to zoom out, and 0 to
        reset the view.
      </p>
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="absolute inset-0 size-full"
      />
    </div>
  );
}
