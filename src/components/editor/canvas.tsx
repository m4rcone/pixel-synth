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
/** Distance in px within which a press grabs the split divider. */
const DIVIDER_GRAB = 16;
const SPLIT_STEP = 0.05;

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
  const draggingDivider = useRef(false);
  const [view, setView] = useState<Size>({ width: 0, height: 0 });

  const {
    position,
    setPosition,
    zoom,
    setZoom,
    resetView,
    showProcessed,
    split,
    setSplit,
  } = useCanvasContext();
  const { source, result } = useEditorState();
  const splitting = split !== null && !!result && !!source;
  const image = splitting
    ? result
    : (showProcessed && result) || source?.bitmap || null;

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
    const left = (view.width - width) / 2 + position.x;
    const top = (view.height - height) / 2 + position.y;
    ctx.imageSmoothingEnabled = scale < 1;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(image, left, top, width, height);

    if (splitting && source) {
      // Original on the left of the divider, processed on the right.
      const dividerX = Math.round(view.width * split);
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, dividerX, view.height);
      ctx.clip();
      ctx.clearRect(0, 0, dividerX, view.height);
      ctx.drawImage(source.bitmap, left, top, width, height);
      ctx.restore();
      ctx.fillStyle = "rgb(236 228 214 / 0.9)";
      ctx.fillRect(dividerX - 0.5, 0, 1, view.height);
      ctx.beginPath();
      ctx.arc(dividerX, view.height / 2, 6, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [image, view, scale, position, splitting, split, source]);

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
    const rect = event.currentTarget.getBoundingClientRect();
    draggingDivider.current =
      splitting &&
      Math.abs(event.clientX - rect.left - view.width * split) <= DIVIDER_GRAB;
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

    if (draggingDivider.current) {
      const rect = event.currentTarget.getBoundingClientRect();
      setSplit(Math.min(1, Math.max(0, (current.x - rect.left) / rect.width)));
      return;
    }

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
    draggingDivider.current = false;
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
      case "[":
      case "]": {
        if (!splitting) return;
        const next = Math.min(
          1,
          Math.max(0, split + (event.key === "]" ? SPLIT_STEP : -SPLIT_STEP)),
        );
        setSplit(next);
        onStatusChange?.(`Divider at ${Math.round(next * 100)}%.`);
        break;
      }
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
        splitting
          ? "Split comparison canvas, original on the left"
          : showProcessed && result
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
        reset the view. In split view, the left and right square brackets move
        the divider.
      </p>
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="absolute inset-0 size-full"
      />
    </div>
  );
}
