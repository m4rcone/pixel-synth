"use client";

import { useCallback } from "react";
import { useEditorActions, useEditorState } from "@/contexts/editor-context";
import { pixelArtSettings } from "@/lib/editor/pixel-art";
import { track } from "@/lib/track";

/**
 * Applies the pixel art preset to the loaded image and renders it. Shared by
 * the editor button and the `?preset=pixel-art` link so both behave the same.
 */
export function usePixelArtPreset() {
  const { source } = useEditorState();
  const { commit } = useEditorActions();

  return useCallback(() => {
    if (!source) return;
    const size = { width: source.pixels.width, height: source.pixels.height };
    commit((settings) => pixelArtSettings(settings, size));
    track("preset_applied", { preset: "pixel-art" });
  }, [source, commit]);
}
