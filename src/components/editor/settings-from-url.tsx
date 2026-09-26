"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useEditorActions, useEditorState } from "@/contexts/editor-context";
import { isAlgorithmId } from "@/lib/algorithms";
import type { EditorSettings } from "@/lib/editor/settings";
import { defaultMatch, isPaletteId } from "@/lib/palettes";
import { useLoadSample } from "@/hooks/use-load-sample";
import { usePixelArtPreset } from "@/hooks/use-pixel-art-preset";

/**
 * Applies deep links from the catalog and the palette page:
 * `/editor?algorithm=<slug>` and `/editor?palette=<id>` (either or both)
 * re-render straight away when an image is already dithered.
 * `/editor?preset=pixel-art` needs the image's size, so it waits for the
 * next image (upload, paste or sample) and then applies the whole preset.
 * `/editor?sample=1` loads the sample image once when the editor is empty,
 * so `?sample=1&preset=pixel-art` opens straight on the pixelated sample.
 */
export function SettingsFromUrl() {
  const params = useSearchParams();
  const algorithm = params.get("algorithm");
  const palette = params.get("palette");
  const preset = params.get("preset");
  const sample = params.get("sample") === "1";
  const { status, source } = useEditorState();
  const { update, commit } = useEditorActions();
  const applyPixelArt = usePixelArtPreset();
  const { loadSample } = useLoadSample();
  const pendingPreset = useRef(false);
  const sampleRequested = useRef(false);

  useEffect(() => {
    pendingPreset.current = preset === "pixel-art";
  }, [preset]);

  useEffect(() => {
    if (!sample || sampleRequested.current || status !== "empty") return;
    sampleRequested.current = true;
    void loadSample();
    // Only on arrival: a later "close image" must not reload the sample.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sample]);

  useEffect(() => {
    if (!pendingPreset.current || !source) return;
    pendingPreset.current = false;
    applyPixelArt();
  }, [source, applyPixelArt]);

  useEffect(() => {
    const validAlgorithm = algorithm && isAlgorithmId(algorithm);
    const validPalette = palette && isPaletteId(palette);
    if (!validAlgorithm && !validPalette) return;

    const apply = status === "dithered" ? commit : update;
    apply(
      (settings): Partial<EditorSettings> => ({
        ...(validAlgorithm ? { algorithm } : {}),
        ...(validPalette
          ? {
              color: {
                ...settings.color,
                mode: "palette",
                palette,
                match: defaultMatch(palette),
              },
            }
          : {}),
      }),
    );
    // Only react to a new link, not to later status changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [algorithm, palette]);

  return null;
}
