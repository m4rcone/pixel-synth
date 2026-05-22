"use client";

import { useImageContext } from "@/contexts/image-context";
import { Button } from "./ui/button";
import { Download } from "lucide-react";

export function SaveButton() {
  const { baseImage, processedImage } = useImageContext();

  function handleSave() {
    if (!processedImage) return;

    let imageUrl: string | null = null;

    const canvas = document.createElement("canvas");
    canvas.width = processedImage.naturalWidth;
    canvas.height = processedImage.naturalHeight;
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.drawImage(processedImage, 0, 0);
    imageUrl = canvas.toDataURL("image/png");

    if (!imageUrl) return;

    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = "pixel-synth.png";
    link.click();
  }

  return (
    <Button
      variant="outline"
      onClick={handleSave}
      disabled={!processedImage || processedImage === baseImage}
      className="font-mono flex gap-1.5 text-xs tracking-[0.12em] uppercase"
    >
      <Download className="h-4 w-4" />
      Save
    </Button>
  );
}
