"use client";

import { useState } from "react";
import { GlobalHeader } from "@/components/global-header";
import { Canvas } from "@/components/editor/canvas";
import { CanvasToolbar } from "@/components/editor/canvas-toolbar";
import { ControlPanel } from "@/components/editor/control-panel";
import { ImageDropzone } from "@/components/editor/image-dropzone";
import { useEditorActions, useEditorState } from "@/contexts/editor-context";

export default function EditorPage() {
  const { status, source, result, isRendering, error } = useEditorState();
  const { setError } = useEditorActions();
  const [manualAnnouncement, setManualAnnouncement] = useState("");

  const announcement = isRendering
    ? "Rendering image."
    : manualAnnouncement ||
      (status === "dithered" && result
        ? "Rendered image is ready."
        : source
          ? "Image uploaded. Editor controls are now available."
          : "");

  return (
    <>
      <GlobalHeader page="Editor" />
      <h1 tabIndex={-1} className="sr-only">
        PixelSynth editor
      </h1>
      <p aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
      </p>

      <div className="flex flex-col lg:h-[calc(100svh-3.5rem)] lg:flex-row">
        <section
          aria-label="Image editor workspace"
          className="relative flex min-w-0 flex-1 flex-col"
        >
          {error && (
            <div
              role="alert"
              className="border-safelight/40 bg-safelight/10 text-paper m-4 mb-0 flex items-start justify-between gap-3 rounded-lg border px-4 py-3 text-sm"
            >
              <p>{error}</p>
              <button
                type="button"
                onClick={() => setError(null)}
                className="text-label text-paper-dim hover:text-paper focus-visible:ring-ring shrink-0 rounded-sm focus-visible:ring-2 focus-visible:outline-hidden"
              >
                Dismiss
              </button>
            </div>
          )}
          <div className="bg-ink-sunken relative min-h-0 flex-1">
            {status === "empty" ? (
              <ImageDropzone />
            ) : (
              <Canvas onStatusChange={setManualAnnouncement} />
            )}
          </div>
          <CanvasToolbar onStatusChange={setManualAnnouncement} />
        </section>

        <ControlPanel className="border-line lg:w-80 lg:shrink-0 lg:border-l" />
      </div>
    </>
  );
}
