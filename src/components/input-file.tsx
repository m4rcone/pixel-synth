"use client";

import { type ChangeEvent } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useImageContext } from "@/contexts/image-context";
import { EditorState } from "@/lib/enum/editor-state";

export function InputFile() {
  const { setBaseImage, setEditorState } = useImageContext();

  async function handleFileUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

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

  return (
    <div className="flex h-[300px] items-center justify-center px-6 py-4 md:h-[500px] lg:h-full">
      <div className="flex flex-col gap-3">
        <Label htmlFor="image-upload" className="justify-center font-semibold">
          Click to start
        </Label>
        <Input
          id="image-upload"
          type="file"
          accept="image/*"
          aria-describedby="image-upload-description"
          onChange={handleFileUpload}
        />
        <span
          id="image-upload-description"
          className="text-muted-foreground text-center text-xs"
        >
          All image formats supported by your browser
        </span>
      </div>
    </div>
  );
}
