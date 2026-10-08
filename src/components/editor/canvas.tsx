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
import { frameResult, useEditorState } from "@/contexts/editor-context";
import {
  frameLabel,
  useAnimationControls,
  useAnimationPlayback,
} from "@/hooks/use-animation-playback";

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
/** Checkerboard behind transparent pixels: cell size (CSS px) and shades. */
const CHECKER_CELL = 8;
// Neutral grays, like the image well: no tint over the user's colors.
const CHECKER_SHADES = ["#303030", "#1a1a1a"];

let checkerTile: HTMLCanvasElement | null = null;
function checkerPattern(ctx: CanvasRenderingContext2D) {
  if (!checkerTile) {
    checkerTile = document.createElement("canvas");
    checkerTile.width = checkerTile.height = CHECKER_CELL * 2;
    const tile = checkerTile.getContext("2d")!;
    tile.fillStyle = CHECKER_SHADES[0];
    tile.fillRect(0, 0, CHECKER_CELL * 2, CHECKER_CELL * 2);
    tile.fillStyle = CHECKER_SHADES[1];
    tile.fillRect(0, 0, CHECKER_CELL, CHECKER_CELL);
    tile.fillRect(CHECKER_CELL, CHECKER_CELL, CHECKER_CELL, CHECKER_CELL);
  }
  return ctx.createPattern(checkerTile, "repeat");
}

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
  const state = useEditorState();
  const { source, result } = state;
  useAnimationPlayback();
  const {
    animation,
    count,
    frame: frameIndex,
    playing,
    togglePlaying,
    step: stepFrame,
  } = useAnimationControls();
  // The shown frame, before and after.
  const original = animation ? animation.bitmaps[frameIndex] : source?.bitmap;
  const processed = frameResult(state, frameIndex);
  const splitting = split !== null && !!result && !!source;
  const image = splitting
    ? (processed ?? original)
    : (showProcessed && processed) || original || null;

  // Layout always uses the source's size: a result rendered at a lower
  // processing scale is stretched over the same rectangle, so toggling and
  // the split view line up exactly.
  const frame = source
    ? { width: source.pixels.width, height: source.pixels.height }
    : null;
  const fit = frame
    ? Math.min(view.width / frame.width, view.height / frame.height) *
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
    // Resizing reallocates the backing store: only when the size changes,
    // not on every pan or animation frame.
    const pixelWidth = Math.round(view.width * dpr);
    const pixelHeight = Math.round(view.height * dpr);
    if (canvas.width !== pixelWidth) canvas.width = pixelWidth;
    if (canvas.height !== pixelHeight) canvas.height = pixelHeight;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, view.width, view.height);
    if (!image || !frame) return;

    const width = frame.width * scale;
    const height = frame.height * scale;
    const left = (view.width - width) / 2 + position.x;
    const top = (view.height - height) / 2 + position.y;
    // Smooth only when shrinking; enlarged pixels stay crisp. A
    // checkerboard shows through transparent pixels.
    const draw = (bitmap: ImageBitmap) => {
      const checker = checkerPattern(ctx);
      if (checker) {
        ctx.fillStyle = checker;
        ctx.fillRect(left, top, width, height);
      }
      ctx.imageSmoothingEnabled = width < bitmap.width;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(bitmap, left, top, width, height);
    };
    draw(image);

    if (splitting && source) {
      // Original on the left of the divider, processed on the right.
      const dividerX = Math.round(view.width * split);
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, dividerX, view.height);
      ctx.clip();
      ctx.clearRect(0, 0, dividerX, view.height);
      draw(original!);
      ctx.restore();
      // Paper divider with a square grip: the console has no round shapes.
      // The grip is dark with a paper edge, so it shows on black and white.
      const styles = getComputedStyle(canvas);
      const paper = styles.getPropertyValue("--paper");
      ctx.save();
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = paper;
      ctx.fillRect(dividerX - 0.5, 0, 1, view.height);
      ctx.globalAlpha = 1;
      ctx.fillStyle = styles.getPropertyValue("--ink");
      ctx.fillRect(dividerX - 6, view.height / 2 - 6, 12, 12);
      ctx.strokeStyle = paper;
      ctx.lineWidth = 1;
      ctx.strokeRect(dividerX - 5.5, view.height / 2 - 5.5, 11, 11);
      ctx.restore();
    }
    // frame is derived from source.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [image, view, scale, position, splitting, split, source, original]);

  /** Zoom by `factor`, keeping the point under (x, y) fixed on screen. */
  function zoomAround(factor: number, x: number, y: number) {
    if (!frame) return;
    const next = clampZoom(zoom * factor);
    const nextScale = fit * next;
    const left = (view.width - frame.width * scale) / 2 + position.x;
    const top = (view.height - frame.height * scale) / 2 + position.y;
    const u = (x - left) / scale;
    const v = (y - top) / scale;
    setZoom(next);
    setPosition({
      x: x - u * nextScale - (view.width - frame.width * nextScale) / 2,
      y: y - v * nextScale - (view.height - frame.height * nextScale) / 2,
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
      case ",":
      case ".": {
        if (!animation) return;
        const next = stepFrame(event.key === "." ? 1 : -1);
        onStatusChange?.(`${frameLabel(next, count)}.`);
        break;
      }
      case "k":
      case "K":
        if (!animation) return;
        togglePlaying();
        onStatusChange?.(playing ? "Animation paused." : "Animation playing.");
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
      className="focus-visible:ring-ring relative h-75 min-w-0 cursor-grab touch-none overflow-hidden select-none focus-visible:ring-2 focus-visible:outline-hidden focus-visible:ring-inset active:cursor-grabbing md:h-125 lg:h-full"
    >
      <p id="canvas-keyboard-instructions" className="sr-only">
        Interactive image preview. Use arrow keys to pan, Shift plus arrow keys
        to pan farther, plus or equals to zoom in, minus to zoom out, and 0 to
        reset the view. In split view, the left and right square brackets move
        the divider.
        {animation &&
          " In an animation, comma and period step one frame back or forward, and K plays or pauses."}
      </p>
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="absolute inset-0 size-full"
      />
    </div>
  );
}
