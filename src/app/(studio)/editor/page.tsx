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
import { track } from "@/lib/track";
import { cn } from "@/lib/utils";

export default function EditorPage() {
  const { status, source, result, isRendering, renderProgress, error } =
    useEditorState();
  const { setError, load, readImage } = useEditorActions();
  // A canvas or toolbar message ("Canvas panned up.") holds only until the
  // image or its render changes; then the render state speaks again.
  const [manual, setManual] = useState<{ text: string; context: unknown }>({
    text: "",
    context: null,
  });
  const context = result ?? source;
  const manualAnnouncement = manual.context === context ? manual.text : "";
  const announce = (text: string) => setManual({ text, context });

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
        const image = await readImage(file);
        load(image);
        track("image_loaded", { source: "paste", animated: !!image.animation });
      } catch (error) {
        setError(
          error instanceof ImageLoadError
            ? error.message
            : "Couldn’t open the pasted image.",
        );
      }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [status, load, readImage, setError]);

  // A new image renders on arrival, so its first render says it loaded. The
  // image counts as settled once any render ends (a failed one too), so
  // later renders, retries included, announce themselves plainly.
  const [settledSource, setSettledSource] = useState(source);
  if (source && !isRendering && settledSource !== source) {
    setSettledSource(source);
  }

  // Animations announce the start and end of a render, never each frame.
  const frames = source?.animation?.frames.length;
  const loaded = frames
    ? `Animated GIF loaded: ${frames} frames.`
    : "Image loaded.";
  const announcement = isRendering
    ? settledSource === source
      ? frames
        ? "Rendering animation."
        : "Rendering image."
      : `${loaded} Editor controls are now available.`
    : manualAnnouncement ||
      (result
        ? frames
          ? "Animation ready."
          : "Rendered image is ready."
        : source
          ? loaded
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

      <div className="lg:h-below-header flex flex-col lg:flex-row">
        <section
          aria-label="Image editor workspace"
          // Pinned on phones only once there is an image to keep in view.
          className={cn(
            "bg-ink flex min-w-0 flex-1 flex-col",
            status === "empty" ? "relative" : "sticky-workspace",
          )}
        >
          {error && (
            <div
              role="alert"
              className="border-danger/40 bg-danger/10 text-paper m-4 mb-0 flex items-start justify-between gap-3 border px-4 py-3 text-sm"
            >
              <p>{error}</p>
              <button
                type="button"
                onClick={() => setError(null)}
                className="text-label text-paper-dim hover:text-paper-hot focus-visible:ring-ring shrink-0 focus-visible:ring-2 focus-visible:outline-hidden"
              >
                Dismiss
              </button>
            </div>
          )}
          <div className="bg-ink-sunken relative min-h-0 flex-1">
            {status === "empty" ? (
              <ImageDropzone />
            ) : (
              <Canvas onStatusChange={announce} />
            )}
            {renderProgress && <RenderProgress {...renderProgress} />}
          </div>
          <CanvasToolbar onStatusChange={announce} />
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
        className="bg-paper/15 h-0.5 overflow-hidden"
      >
        <div
          className="bg-safelight h-full origin-left"
          style={{ transform: `scaleX(${done / total})` }}
        />
      </div>
    </div>
  );
}
