"use client";

import { useCallback } from "react";
import { useEditorActions, useEditorState } from "@/contexts/editor-context";
import { pixelArtSettings } from "@/lib/editor/pixel-art";

/**
 * Applies the pixel art preset to the loaded image and renders it, whether or
 * not dithering was already applied. Shared by the editor button and the
 * `?preset=pixel-art` link so both behave the same.
 */
export function usePixelArtPreset() {
  const { status, source } = useEditorState();
  const { update, commit, applyDither } = useEditorActions();

  return useCallback(() => {
    if (!source) return;
    const size = { width: source.pixels.width, height: source.pixels.height };
    if (status === "dithered") {
      commit((settings) => pixelArtSettings(settings, size));
    } else {
      update((settings) => pixelArtSettings(settings, size));
      applyDither();
    }
  }, [status, source, update, commit, applyDither]);
}
