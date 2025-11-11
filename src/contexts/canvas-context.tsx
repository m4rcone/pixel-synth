"use client";

import { createContext, useContext, useState } from "react";
import type { Dispatch, SetStateAction, ReactNode } from "react";

type CanvasContextValue = {
  position: { x: number; y: number };
  setPosition: Dispatch<SetStateAction<{ x: number; y: number }>>;
  scaleZoom: number;
  setScaleZoom: Dispatch<SetStateAction<number>>;
  showProcessed: boolean;
  setShowProcessed: Dispatch<SetStateAction<boolean>>;
};

const CanvasContext = createContext<CanvasContextValue | undefined>(undefined);

export function CanvasProvider({ children }: { children: ReactNode }) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [scaleZoom, setScaleZoom] = useState(1);
  const [showProcessed, setShowProcessed] = useState(true);

  return (
    <CanvasContext.Provider
      value={{
        position,
        setPosition,
        scaleZoom,
        setScaleZoom,
        showProcessed,
        setShowProcessed,
      }}
    >
      {children}
    </CanvasContext.Provider>
  );
}

export function useCanvasContext() {
  const context = useContext(CanvasContext);
  if (!context) {
    throw new Error("useCanvasContext must be used within an CanvasProvider");
  }
  return context;
}
