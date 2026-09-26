"use client";

import { createContext, useContext, useMemo, useState } from "react";
import type { Dispatch, SetStateAction, ReactNode } from "react";

export const MIN_ZOOM = 0.1;
export const MAX_ZOOM = 10;
export const ZOOM_STEP = 1.2;

export type Point = { x: number; y: number };

type CanvasContextValue = {
  position: Point;
  setPosition: Dispatch<SetStateAction<Point>>;
  zoom: number;
  setZoom: Dispatch<SetStateAction<number>>;
  showProcessed: boolean;
  setShowProcessed: Dispatch<SetStateAction<boolean>>;
  /** Split before/after divider position (0–1), or null when off. */
  split: number | null;
  setSplit: Dispatch<SetStateAction<number | null>>;
  resetView: () => void;
  /** Shown frame of an animation (0 for a still image). */
  frame: number;
  setFrame: Dispatch<SetStateAction<number>>;
  /** Whether an animation is playing. */
  playing: boolean;
  setPlaying: Dispatch<SetStateAction<boolean>>;
};

const CanvasContext = createContext<CanvasContextValue | undefined>(undefined);

export function clampZoom(zoom: number) {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));
}

export function CanvasProvider({ children }: { children: ReactNode }) {
  const [position, setPosition] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [showProcessed, setShowProcessed] = useState(true);
  const [split, setSplit] = useState<number | null>(null);
  const [frame, setFrame] = useState(0);
  const [playing, setPlaying] = useState(false);

  const value = useMemo(
    () => ({
      position,
      setPosition,
      zoom,
      setZoom,
      showProcessed,
      setShowProcessed,
      split,
      setSplit,
      resetView: () => {
        setZoom(1);
        setPosition({ x: 0, y: 0 });
      },
      frame,
      setFrame,
      playing,
      setPlaying,
    }),
    [position, zoom, showProcessed, split, frame, playing],
  );

  return (
    <CanvasContext.Provider value={value}>{children}</CanvasContext.Provider>
  );
}

export function useCanvasContext() {
  const context = useContext(CanvasContext);
  if (!context) {
    throw new Error("useCanvasContext must be used within a CanvasProvider");
  }
  return context;
}
