"use client";

import { useCallback, useState } from "react";
import { useEditorActions } from "@/contexts/editor-context";
import { ImageLoadError } from "@/lib/editor/load-image";
import { ANIMATED_SAMPLE, SAMPLE_IMAGE } from "@/lib/samples";
import { track } from "@/lib/track";

export type SampleKind = "still" | "animated";

const SAMPLES = { still: SAMPLE_IMAGE, animated: ANIMATED_SAMPLE };

/**
 * Loads a bundled sample through the same path as an upload. Shared by the
 * dropzone's "Try a sample image" and "Try an animated sample" buttons and
 * the `?sample=1` and `?sample=animated` links.
 */
export function useLoadSample() {
  const { load, readImage, setError } = useEditorActions();
  const [loading, setLoading] = useState<SampleKind | null>(null);

  const loadSample = useCallback(
    async (kind: SampleKind = "still") => {
      const sample = SAMPLES[kind];
      setLoading(kind);
      try {
        const response = await fetch(sample.src);
        if (!response.ok) throw new Error(String(response.status));
        const blob = await response.blob();
        const image = await readImage(
          new File([blob], sample.name, {
            type:
              blob.type || (kind === "animated" ? "image/gif" : "image/png"),
          }),
        );
        load(image);
        track("image_loaded", {
          source: kind === "animated" ? "sample_animated" : "sample",
          animated: !!image.animation,
        });
      } catch (error) {
        setError(
          error instanceof ImageLoadError
            ? error.message
            : "Couldn’t load the sample image. Check your connection and try again.",
        );
      } finally {
        setLoading(null);
      }
    },
    [load, readImage, setError],
  );

  return { loadSample, loading };
}
