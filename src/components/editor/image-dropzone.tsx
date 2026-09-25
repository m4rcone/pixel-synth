"use client";

import { type ChangeEvent, type DragEvent, useRef, useState } from "react";
import { ImageUp } from "lucide-react";
import { useEditorActions } from "@/contexts/editor-context";
import { ImageLoadError, loadImageFile } from "@/lib/editor/load-image";
import { cn } from "@/lib/utils";

export function ImageDropzone() {
  const { load, setError } = useEditorActions();
  const dragDepth = useRef(0);
  const [isDragging, setIsDragging] = useState(false);

  async function openFile(file: File) {
    try {
      load(await loadImageFile(file));
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
    <div className="relative flex h-[300px] items-center justify-center px-6 py-4 md:h-[500px] lg:h-full">
      <div
        aria-hidden="true"
        className="lab-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(70%_60%_at_50%_50%,black,transparent_75%)] opacity-40"
      />

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
              : "border-line-strong bg-ink-raised/40 hover:border-safelight/60 hover:bg-ink-raised/70",
          )}
        >
          <span
            aria-hidden="true"
            className={cn(
              "lab-dots border-line-strong group-hover:text-safelight grid size-14 place-items-center rounded-xl border transition-colors",
              isDragging ? "text-safelight" : "text-paper/50",
            )}
          >
            <ImageUp className="size-6" />
          </span>

          <span className="flex flex-col gap-1.5">
            <span className="font-display text-2xl tracking-tight">
              Drop an image to develop
            </span>
            <span className="text-label text-paper-dim">Click to browse</span>
          </span>

          <input
            id="image-upload"
            type="file"
            accept="image/*"
            aria-describedby="image-upload-description"
            onChange={handleChange}
            className="sr-only"
          />
        </label>

        <p
          id="image-upload-description"
          className="text-label text-paper-dim mt-5 text-center"
        >
          Any browser-supported format · Processed locally
        </p>
      </div>
    </div>
  );
}
