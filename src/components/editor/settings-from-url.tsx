"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useEditorActions, useEditorState } from "@/contexts/editor-context";
import { isAlgorithmId } from "@/lib/algorithms";
import type { EditorSettings } from "@/lib/editor/settings";
import { defaultMatch, isPaletteId } from "@/lib/palettes";

/**
 * Applies deep links from the catalog and the palette page:
 * `/editor?algorithm=<slug>` and `/editor?palette=<id>` (either or both).
 * Re-renders straight away when an image is already dithered.
 */
export function SettingsFromUrl() {
  const params = useSearchParams();
  const algorithm = params.get("algorithm");
  const palette = params.get("palette");
  const { status } = useEditorState();
  const { update, commit } = useEditorActions();

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
