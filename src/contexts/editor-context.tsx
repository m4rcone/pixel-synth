"use client";

import type { Dispatch, SetStateAction, ReactNode } from "react";
import { createContext, useContext, useState } from "react";
import { DitherAlgorithm } from "@/lib/enum/dither-algorithm";
import { useImageContext } from "./image-context";
import { Filters } from "@/lib/types/filters";
import { EditorState } from "@/lib/enum/editor-state";
import {
  DEFAULT_COLOR_COUNT,
  DEFAULT_COLORS,
  DEFAULT_DITHER_SCALE,
  DEFAULT_FILTERS,
  DEFAULT_TONE_RANGE,
} from "@/lib/editor/default-values";

type EditorContextValue = {
  isRendering: boolean;
  setIsRendering: Dispatch<SetStateAction<boolean>>;

  ditherScale: number;
  setDitherScale: Dispatch<SetStateAction<number>>;

  ditherAlgorithm: DitherAlgorithm;
  setDitherAlgorithm: Dispatch<SetStateAction<DitherAlgorithm>>;

  filters: Filters;
  setFilters: Dispatch<SetStateAction<Filters>>;

  colorCount: number;
  setcolorCount: Dispatch<SetStateAction<number>>;

  luminance: boolean;
  setLuminance: Dispatch<SetStateAction<boolean>>;

  highlightsColor: string;
  setHighlightsColor: Dispatch<SetStateAction<string>>;
  highlightsToneRange: number;
  setHighlightsToneRange: Dispatch<SetStateAction<number>>;

  midtonesColor: string;
  setMidtonesColor: Dispatch<SetStateAction<string>>;
  midtonesToneRange: number;
  setMidtonesToneRange: Dispatch<SetStateAction<number>>;

  shadowsColor: string;
  setShadowsColor: Dispatch<SetStateAction<string>>;
  shadowsToneRange: number;
  setShadowsToneRange: Dispatch<SetStateAction<number>>;

  handleRender: (hasDither: boolean) => Promise<void>;
};

const EditorContext = createContext<EditorContextValue | undefined>(undefined);

export function EditorProvider({ children }: { children: ReactNode }) {
  const [isRendering, setIsRendering] = useState(false);

  const [ditherScale, setDitherScale] = useState(DEFAULT_DITHER_SCALE);

  const [ditherAlgorithm, setDitherAlgorithm] = useState(
    DitherAlgorithm.FloydSteinberg,
  );
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);

  const [colorCount, setcolorCount] = useState(DEFAULT_COLOR_COUNT);

  const [luminance, setLuminance] = useState(false);

  const [highlightsColor, setHighlightsColor] = useState(
    DEFAULT_COLORS.highlights,
  );
  const [highlightsToneRange, setHighlightsToneRange] = useState(
    DEFAULT_TONE_RANGE.highlights,
  );

  const [midtonesColor, setMidtonesColor] = useState(DEFAULT_COLORS.midtones);
  const [midtonesToneRange, setMidtonesToneRange] = useState(
    DEFAULT_TONE_RANGE.midtones,
  );

  const [shadowsColor, setShadowsColor] = useState(DEFAULT_COLORS.shadows);
  const [shadowsToneRange, setShadowsToneRange] = useState(
    DEFAULT_TONE_RANGE.shadows,
  );

  const { baseImage, setProcessedImage, setEditorState } = useImageContext();

  async function handleRender(hasDither: boolean) {
    if (!baseImage) return;

    setIsRendering(true);

    if (hasDither) {
      setEditorState(EditorState.Rendered);
    }

    try {
      const { renderPipeline } = await import("@/lib/editor/render");
      const result = await renderPipeline({
        baseImage,
        hasDither,
        ditherScale,
        ditherAlgorithm,
        filters,
        colorCount,
        luminance,
        colors: {
          shadows: { hex: shadowsColor, range: shadowsToneRange },
          midtones: { hex: midtonesColor, range: midtonesToneRange },
          highlights: { hex: highlightsColor, range: highlightsToneRange },
        },
      });
      setProcessedImage(result);
      setIsRendering(false);
    } catch (error) {
      console.error(error);
    } finally {
      setIsRendering(false);
    }
  }

  return (
    <EditorContext.Provider
      value={{
        isRendering,
        setIsRendering,
        ditherScale,
        setDitherScale,
        ditherAlgorithm,
        setDitherAlgorithm,
        filters,
        setFilters,
        colorCount,
        setcolorCount,
        luminance,
        setLuminance,
        highlightsColor,
        setHighlightsColor,
        highlightsToneRange,
        setHighlightsToneRange,
        midtonesColor,
        setMidtonesColor,
        midtonesToneRange,
        setMidtonesToneRange,
        shadowsColor,
        setShadowsColor,
        shadowsToneRange,
        setShadowsToneRange,
        handleRender,
      }}
    >
      {children}
    </EditorContext.Provider>
  );
}

export function useEditorContext() {
  const context = useContext(EditorContext);
  if (!context) {
    throw new Error("useEditorContext must be used within an EditorProvider");
  }
  return context;
}
