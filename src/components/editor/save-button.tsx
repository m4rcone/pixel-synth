"use client";

import { Download } from "lucide-react";
import { useEditorState } from "@/contexts/editor-context";
import { Button } from "@/components/ui/button";

export function SaveButton() {
  const { status, result, settings } = useEditorState();

  function handleSave() {
    if (!result) return;

    const canvas = document.createElement("canvas");
    canvas.width = result.naturalWidth;
    canvas.height = result.naturalHeight;
    canvas.getContext("2d")?.drawImage(result, 0, 0);

    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `pixelsynth-${status === "dithered" ? settings.algorithm : "filtered"}.png`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 0);
    }, "image/png");
  }

  return (
    <Button variant="outline" onClick={handleSave} disabled={!result}>
      <Download aria-hidden="true" />
      Save
    </Button>
  );
}
