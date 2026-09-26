"use client";

import { type ChangeEvent, type DragEvent, useRef, useState } from "react";
import { ImageUp, LoaderCircle, Sunset } from "lucide-react";
import { useEditorActions } from "@/contexts/editor-context";
import {
  ImageLoadError,
  SUPPORTED_FORMATS_DETAIL,
  SUPPORTED_IMAGE_TYPES,
} from "@/lib/editor/load-image";
import { cn } from "@/lib/utils";
import { useLoadSample } from "@/hooks/use-load-sample";
import { Button } from "@/components/ui/button";

export function ImageDropzone() {
  const { load, readImage, setError } = useEditorActions();
  const dragDepth = useRef(0);
  const [isDragging, setIsDragging] = useState(false);
  const { loadSample, loading: loadingSample } = useLoadSample();

  async function openFile(file: File) {
    try {
      load(await readImage(file));
    } catch (error) {
      setError(
        error instanceof ImageLoadError
          ? error.message
          : "Could not open that image.",
      );
    }
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) void openFile(file);
  }

  function handleDragEnter(event: DragEvent) {
    event.preventDefault();
    dragDepth.current += 1;
    setIsDragging(true);
  }

  function handleDragLeave(event: DragEvent) {
    event.preventDefault();
    dragDepth.current = Math.max(0, dragDepth.current - 1);
    if (dragDepth.current === 0) setIsDragging(false);
  }

  function handleDrop(event: DragEvent) {
    event.preventDefault();
    dragDepth.current = 0;
    setIsDragging(false);
    const file = event.dataTransfer.files[0];
    if (file) void openFile(file);
  }

  return (
    <div className="relative flex min-h-[420px] items-center justify-center px-6 py-8 md:min-h-[500px] lg:h-full">
      <div className="relative w-full max-w-md">
        {/* The label wraps the visually hidden input, so it is the click target. */}
        <label
          htmlFor="image-upload"
          onDragEnter={handleDragEnter}
          onDragOver={(event) => event.preventDefault()}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "group flex cursor-pointer flex-col items-center gap-5 rounded-2xl border border-dashed px-8 py-12 text-center transition-colors",
            "focus-within:border-safelight focus-within:ring-safelight focus-within:ring-2",
            isDragging
              ? "border-safelight bg-ink-raised/80"
              : "border-line-strong bg-ink-raised/40 hover:border-paper hover:bg-ink-raised/70",
          )}
        >
          <span
            aria-hidden="true"
            className={cn(
              "border-line-strong group-hover:text-paper-hot grid size-14 place-items-center rounded-xl border transition-colors",
              isDragging ? "text-safelight" : "text-paper/50",
            )}
          >
            <ImageUp className="size-6" />
          </span>

          <span className="flex flex-col gap-1.5">
            <span className="text-heading font-semibold">
              Drop an image to develop
            </span>
            <span className="text-paper-dim text-sm">
              Click to browse, or paste from the clipboard
            </span>
          </span>

          <input
            id="image-upload"
            type="file"
            accept={SUPPORTED_IMAGE_TYPES.join(",")}
            aria-describedby="image-upload-description"
            onChange={handleChange}
            className="sr-only"
          />
        </label>

        <p
          id="image-upload-description"
          className="text-paper-dim mt-4 text-center text-sm"
        >
          {SUPPORTED_FORMATS_DETAIL} · Processed locally
        </p>

        <div className="mt-6 flex flex-col items-center gap-3">
          <span className="text-paper-dim text-sm">or</span>
          <Button
            variant="outline"
            onClick={() => loadSample("still")}
            disabled={loadingSample !== null}
          >
            {loadingSample === "still" ? (
              <LoaderCircle className="animate-spin" aria-hidden="true" />
            ) : (
              <Sunset aria-hidden="true" />
            )}
            {loadingSample === "still"
              ? "Loading sample…"
              : "Try a sample image"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => loadSample("animated")}
            disabled={loadingSample !== null}
            className="text-paper-dim hover:text-paper"
          >
            {loadingSample === "animated" && (
              <LoaderCircle className="animate-spin" aria-hidden="true" />
            )}
            {loadingSample === "animated"
              ? "Loading animated sample…"
              : "Try an animated sample"}
          </Button>
        </div>
      </div>
    </div>
  );
}
