"use client";

import { type ChangeEvent, type DragEvent, useRef, useState } from "react";
import { LoaderCircle, Lock } from "lucide-react";
import { useEditorActions } from "@/contexts/editor-context";
import {
  ImageLoadError,
  MAX_IMAGE_SIZE,
  SUPPORTED_FORMATS_SHORT,
  SUPPORTED_IMAGE_TYPES,
} from "@/lib/editor/load-image";
import { track } from "@/lib/track";
import { cn } from "@/lib/utils";
import { useLoadSample } from "@/hooks/use-load-sample";
import { buttonVariants } from "@/components/ui/button";
import { textLink } from "@/components/ui/link-styles";

export function ImageDropzone() {
  const { load, readImage, setError } = useEditorActions();
  const dragDepth = useRef(0);
  const [isDragging, setIsDragging] = useState(false);
  const { loadSample, loading: loadingSample } = useLoadSample();

  async function openFile(file: File) {
    try {
      const image = await readImage(file);
      load(image);
      track("image_loaded", { source: "upload", animated: !!image.animation });
    } catch (error) {
      setError(
        error instanceof ImageLoadError
          ? error.message
          : "Couldn’t open that image.",
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

  const sampleLink = `${textLink} inline-flex items-center gap-1.5 disabled:opacity-60`;

  return (
    // The whole well takes drops, framed like a viewfinder.
    <div
      onDragEnter={handleDragEnter}
      onDragOver={(event) => event.preventDefault()}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "relative flex min-h-105 items-center justify-center px-6 pt-12 pb-24 transition-colors md:min-h-125 lg:h-full",
        isDragging && "bg-ink-raised/60",
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "reticle pointer-events-none absolute inset-4 transition-colors",
          isDragging ? "text-safelight" : "text-line-strong",
        )}
      />

      <div className="relative flex w-full max-w-xl flex-col items-center gap-5 text-center">
        <span
          aria-hidden="true"
          className={cn(
            "crosshair size-11 transition-colors",
            isDragging ? "text-safelight" : "text-paper-dim",
          )}
        />
        <p
          id="dropzone-title"
          className="font-display text-title text-glow font-normal text-balance"
        >
          Drop an image
        </p>
        <p className="text-paper-dim -mt-2 text-sm">
          or paste from the clipboard
        </p>

        {/* The label is the visible button; the input inside it takes focus,
            so keyboard users get the same control. */}
        <label
          className={cn(
            buttonVariants({ size: "lg" }),
            "has-focus-visible:outline-safelight cursor-pointer has-focus-visible:outline-2 has-focus-visible:outline-offset-3 has-focus-visible:outline-solid",
          )}
        >
          <span id="dropzone-choose">Choose image</span>
          <input
            id="image-upload"
            type="file"
            accept={SUPPORTED_IMAGE_TYPES.join(",")}
            aria-labelledby="dropzone-title dropzone-choose"
            aria-describedby="image-upload-description image-upload-limit image-upload-privacy"
            onChange={handleChange}
            className="sr-only"
          />
        </label>

        <p className="text-paper-dim flex items-center justify-center gap-x-2 gap-y-1 text-sm max-sm:flex-col">
          <button
            type="button"
            onClick={() => loadSample("still")}
            disabled={loadingSample !== null}
            className={sampleLink}
          >
            {loadingSample === "still" && (
              <LoaderCircle
                className="size-3.5 animate-spin"
                aria-hidden="true"
              />
            )}
            {loadingSample === "still"
              ? "Loading sample…"
              : "Try a sample image"}
          </button>
          <span aria-hidden="true" className="text-line-strong max-sm:hidden">
            ·
          </span>
          <button
            type="button"
            onClick={() => loadSample("animated")}
            disabled={loadingSample !== null}
            className={sampleLink}
          >
            {loadingSample === "animated" && (
              <LoaderCircle
                className="size-3.5 animate-spin"
                aria-hidden="true"
              />
            )}
            {loadingSample === "animated"
              ? "Loading animated sample…"
              : "Try an animated sample"}
          </button>
        </p>
      </div>

      {/* Console readouts inside the frame: the size limit up top (phones
          have no room for it), formats and privacy along the bottom. */}
      <p
        id="image-upload-limit"
        className="text-caps text-paper-dim absolute top-9 left-10 max-sm:hidden"
      >
        Max {MAX_IMAGE_SIZE} px
        <span className="sr-only">: larger images are scaled down</span>
      </p>

      <div className="text-caps text-paper-dim absolute inset-x-10 bottom-9 flex flex-wrap justify-center gap-x-6 gap-y-1 text-center sm:justify-between">
        <span id="image-upload-description">{SUPPORTED_FORMATS_SHORT}</span>
        <span id="image-upload-privacy" className="flex items-center gap-1.5">
          <Lock aria-hidden="true" className="size-3" />
          <span>
            Local<span className="sr-only">: nothing is uploaded</span>
          </span>
        </span>
      </div>
    </div>
  );
}
