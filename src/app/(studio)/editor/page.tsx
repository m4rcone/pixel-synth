"use client";

import { Suspense, useEffect, useState } from "react";
import { GlobalHeader } from "@/components/global-header";
import { Canvas } from "@/components/editor/canvas";
import { CanvasToolbar } from "@/components/editor/canvas-toolbar";
import { ControlPanel } from "@/components/editor/control-panel";
import { SettingsFromUrl } from "@/components/editor/settings-from-url";
import { ImageDropzone } from "@/components/editor/image-dropzone";
import { ImageLoadError } from "@/lib/editor/load-image";
import { useEditorActions, useEditorState } from "@/contexts/editor-context";

export default function EditorPage() {
  const { status, source, result, isRendering, renderProgress, error } =
    useEditorState();
  const { setError, load, readImage } = useEditorActions();
  const [manualAnnouncement, setManualAnnouncement] = useState("");

  // Paste an image from the clipboard to start (never replaces work in progress).
  useEffect(() => {
    if (status !== "empty") return;
    const onPaste = async (event: ClipboardEvent) => {
      const file = [...(event.clipboardData?.files ?? [])].find((f) =>
        f.type.startsWith("image/"),
      );
      if (!file) return;
      event.preventDefault();
      try {
        load(await readImage(file));
      } catch (error) {
        setError(
          error instanceof ImageLoadError
            ? error.message
            : "Could not open the pasted image.",
        );
      }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [status, load, readImage, setError]);

  // Animations announce the start and end of a render, never each frame.
  const frames = source?.animation?.frames.length;
  const announcement = isRendering
    ? frames && status === "dithered"
      ? "Rendering animation."
      : "Rendering image."
    : manualAnnouncement ||
      (status === "dithered" && result
        ? frames
          ? "Animation ready."
          : "Rendered image is ready."
        : source
          ? `${frames ? `Animated GIF loaded: ${frames} frames.` : "Image uploaded."} Editor controls are now available.`
          : "");

  return (
    <>
      <Suspense fallback={null}>
        <SettingsFromUrl />
      </Suspense>
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
            {renderProgress && <RenderProgress {...renderProgress} />}
          </div>
          <CanvasToolbar onStatusChange={setManualAnnouncement} />
        </section>

        <ControlPanel className="border-line lg:w-80 lg:shrink-0 lg:border-l" />
      </div>
    </>
  );
}

/** Slim bar over the canvas while every frame of an animation renders. */
function RenderProgress({ done, total }: { done: number; total: number }) {
  const label = `Rendering frame ${Math.min(total, done + 1)} of ${total}`;
  return (
    <div className="bg-ink/85 pointer-events-none absolute inset-x-0 top-0 flex flex-col gap-1.5 px-4 pt-2 pb-2.5">
      <span className="text-label text-paper-dim">{label}</span>
      <div
        role="progressbar"
        aria-label="Rendering animation"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={done}
        aria-valuetext={label}
        className="bg-paper/15 h-0.5 overflow-hidden rounded-full"
      >
        <div
          className="bg-safelight h-full origin-left"
          style={{ transform: `scaleX(${done / total})` }}
        />
      </div>
    </div>
  );
}
