"use client";

import { useCallback, useState } from "react";
import { useEditorActions } from "@/contexts/editor-context";
import { ImageLoadError, loadImageFile } from "@/lib/editor/load-image";
import { SAMPLE_IMAGE } from "@/lib/samples";

/**
 * Loads the bundled sample through the same path as an upload. Shared by the
 * dropzone's "Try a sample image" button and the `?sample=1` link.
 */
export function useLoadSample() {
  const { load, setError } = useEditorActions();
  const [loading, setLoading] = useState(false);

  const loadSample = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(SAMPLE_IMAGE.src);
      if (!response.ok) throw new Error(String(response.status));
      const blob = await response.blob();
      load(
        await loadImageFile(
          new File([blob], SAMPLE_IMAGE.name, {
            type: blob.type || "image/png",
          }),
        ),
      );
    } catch (error) {
      setError(
        error instanceof ImageLoadError
          ? error.message
          : "Couldn’t load the sample image. Check your connection and try again.",
      );
    } finally {
      setLoading(false);
    }
  }, [load, setError]);

  return { loadSample, loading };
}
