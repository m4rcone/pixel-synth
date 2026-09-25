"use client";

import { useEffect } from "react";
import { useEditorState } from "@/contexts/editor-context";

/**
 * Warns before the page is unloaded (reload, tab close, external navigation)
 * while there is in-progress editor work. In-app navigation between studio
 * pages preserves state already (providers live in the studio layout), so this
 * only guards the hard exits that always discard in-memory state.
 *
 * Browsers ignore custom text and show their own generic prompt; setting
 * `returnValue` is still required for the prompt to appear cross-browser.
 */
export function UnsavedChangesGuard() {
  const { status } = useEditorState();
  const hasWork = status !== "empty";

  useEffect(() => {
    if (!hasWork) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasWork]);

  return null;
}
