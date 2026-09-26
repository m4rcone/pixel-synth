"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useEditorActions, useEditorState } from "@/contexts/editor-context";
import { isAlgorithmId } from "@/lib/algorithms";
import type { EditorSettings } from "@/lib/editor/settings";
import { decodeSettings, SHARE_PARAM } from "@/lib/editor/share";
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
 * so `?sample=1&preset=pixel-art` opens straight on the pixelated sample;
 * `?sample=animated` loads the animated sample instead.
 * `/editor?s=<code>` (from "Share settings") applies every shared setting;
 * when the link was made after dithering, the next image is dithered too.
 */
export function SettingsFromUrl() {
  const params = useSearchParams();
  const algorithm = params.get("algorithm");
  const palette = params.get("palette");
  const preset = params.get("preset");
  const sampleParam = params.get("sample");
  const sample =
    sampleParam === "1"
      ? "still"
      : sampleParam === "animated"
        ? sampleParam
        : null;
  const shared = params.get(SHARE_PARAM);
  const { status, source } = useEditorState();
  const { update, commit, applyDither, setError } = useEditorActions();
  const applyPixelArt = usePixelArtPreset();
  const { loadSample } = useLoadSample();
  const pendingPreset = useRef(false);
  const sampleRequested = useRef(false);
  const pendingDither = useRef(false);

  useEffect(() => {
    pendingPreset.current = preset === "pixel-art";
  }, [preset]);

  useEffect(() => {
    if (!sample || sampleRequested.current || status !== "empty") return;
    sampleRequested.current = true;
    void loadSample(sample);
    // Only on arrival: a later "close image" must not reload the sample.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sample]);

  useEffect(() => {
    if (!pendingPreset.current || !source) return;
    pendingPreset.current = false;
    applyPixelArt();
  }, [source, applyPixelArt]);

  useEffect(() => {
    if (!shared) return;
    const decoded = decodeSettings(shared);
    if (!decoded) {
      setError(
        "This settings link can’t be read. Check that it was copied whole.",
      );
      return;
    }
    const apply = status === "dithered" ? commit : update;
    apply((current) => ({
      ...decoded.settings,
      // Keep the visitor's own custom palette unless the link brings one.
      color: {
        ...decoded.settings.color,
        custom: decoded.custom ?? current.color.custom,
      },
    }));
    if (decoded.dithered && status === "loaded") applyDither();
    else pendingDither.current = decoded.dithered && status === "empty";
    // Only react to a new link, not to later status changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shared]);

  useEffect(() => {
    if (!pendingDither.current || !source) return;
    pendingDither.current = false;
    applyDither();
  }, [source, applyDither]);

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
