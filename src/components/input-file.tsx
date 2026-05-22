"use client";

import { type ChangeEvent, type DragEvent, useRef, useState } from "react";
import { ImageUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useImageContext } from "@/contexts/image-context";
import { EditorState } from "@/lib/enum/editor-state";

export function InputFile() {
  const { setBaseImage, setEditorState } = useImageContext();
  const dragDepth = useRef(0);
  const [isDragging, setIsDragging] = useState(false);

  function processImageFile(file: File) {
    const reader = new FileReader();

    reader.onload = (event: ProgressEvent<FileReader>) => {
      const result = event.target?.result;
      if (!result) return;

      const img = new Image();
      img.onload = () => {
        const MAX_SIZE = 2000;
        let { width, height } = img;

        if (width > MAX_SIZE || height > MAX_SIZE) {
          const scale = Math.min(MAX_SIZE / width, MAX_SIZE / height);
          width = Math.round(width * scale);
          height = Math.round(height * scale);

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          if (!ctx) return;

          ctx.drawImage(img, 0, 0, width, height);

          const resizedImg = new Image();
          resizedImg.onload = () => {
            setBaseImage(resizedImg);
            setEditorState(EditorState.Uploaded);
          };
          resizedImg.src = canvas.toDataURL("image/png");
        } else {
          setBaseImage(img);
          setEditorState(EditorState.Uploaded);
        }
      };
      img.src = result.toString();
    };

    reader.readAsDataURL(file);
  }

  function handleFileUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    processImageFile(file);
    event.target.value = "";
  }

  function handleDragEnter(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    event.stopPropagation();
    dragDepth.current += 1;
    setIsDragging(true);
  }

  function handleDragOver(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    event.stopPropagation();
  }

  function handleDragLeave(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    event.stopPropagation();
    dragDepth.current = Math.max(0, dragDepth.current - 1);

    if (dragDepth.current === 0) {
      setIsDragging(false);
    }
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    event.stopPropagation();
    dragDepth.current = 0;
    setIsDragging(false);

    const file = Array.from(event.dataTransfer.files).find((file) =>
      file.type.startsWith("image/"),
    );
    if (!file) return;

    processImageFile(file);
  }

  return (
    <div className="relative flex h-[300px] items-center justify-center px-6 py-4 md:h-[500px] lg:h-full">
      {/* atmospheric backdrop */}
      <div
        aria-hidden="true"
        className="lab-grid pointer-events-none absolute inset-0 opacity-40 [mask-image:radial-gradient(70%_60%_at_50%_50%,black,transparent_75%)]"
      />

      <div className="relative w-full max-w-md">
        <Label
          htmlFor="image-upload"
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`group flex cursor-pointer flex-col items-center gap-5 rounded-2xl border border-dashed px-8 py-12 text-center transition-colors focus-within:border-[var(--safelight)] focus-within:ring-2 focus-within:ring-[var(--safelight)] ${
            isDragging
              ? "border-[var(--safelight)] bg-[var(--card)]/80"
              : "border-[var(--line-strong)] bg-[var(--card)]/40 hover:border-[var(--safelight)]/60 hover:bg-[var(--card)]/70"
          }`}
        >
          <span
            aria-hidden="true"
            className={`lab-dots grid size-14 place-items-center rounded-xl border border-[var(--line-strong)] transition-colors group-hover:text-[var(--safelight)] ${
              isDragging ? "text-[var(--safelight)]" : "text-foreground/50"
            }`}
          >
            <ImageUp className="size-6" />
          </span>

          <span className="flex flex-col gap-1.5">
            <span className="font-display text-2xl tracking-tight">
              Drop an image to develop
            </span>
            <span className="font-mono text-[11px] tracking-[0.16em] text-[var(--paper-dim)] uppercase">
              Click to browse
            </span>
          </span>

          <Input
            id="image-upload"
            type="file"
            accept="image/*"
            aria-describedby="image-upload-description"
            onChange={handleFileUpload}
            className="sr-only"
          />
        </Label>

        <p
          id="image-upload-description"
          className="font-mono mt-5 text-center text-[10px] tracking-[0.14em] text-[var(--paper-dim)] uppercase"
        >
          Any browser-supported format · Processed locally
        </p>
      </div>
    </div>
  );
}
