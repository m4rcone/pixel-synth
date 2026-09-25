"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useEditorActions, useEditorState } from "@/contexts/editor-context";
import { isAlgorithmId } from "@/lib/algorithms";

/**
 * Applies `/editor?algorithm=<slug>` (links from the catalog). Re-renders
 * straight away when an image is already dithered.
 */
export function AlgorithmFromUrl() {
  const requested = useSearchParams().get("algorithm");
  const { status } = useEditorState();
  const { update, commit } = useEditorActions();

  useEffect(() => {
    if (!requested || !isAlgorithmId(requested)) return;
    const apply = status === "dithered" ? commit : update;
    apply({ algorithm: requested });
    // Only react to a new link, not to later status changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requested]);

  return null;
}
