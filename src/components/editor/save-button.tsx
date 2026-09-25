"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { useEditorState } from "@/contexts/editor-context";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const FACTORS = [1, 2, 4, 8] as const;
type Factor = (typeof FACTORS)[number];

/** Suggested export size: ×1 for large images, else the largest factor up to ~1000 px. */
function defaultFactor(width: number, height: number): Factor {
  const longest = Math.max(width, height);
  return [...FACTORS].reverse().find((k) => longest * k <= 1000) ?? 1;
}

export function SaveButton() {
  const { status, result, settings } = useEditorState();
  const [open, setOpen] = useState(false);
  const [factor, setFactor] = useState<Factor>(1);

  const width = result?.width ?? 0;
  const height = result?.height ?? 0;

  function fileName() {
    if (status !== "dithered") return "pixelsynth-filtered.png";
    const palette =
      settings.color.mode === "palette" ? `-${settings.color.palette}` : "";
    const size = factor > 1 ? `-${factor}x` : "";
    return `pixelsynth-${settings.algorithm}${palette}${size}.png`;
  }

  function save() {
    if (!result) return;
    // Enlarge without smoothing: each pixel becomes a crisp k×k block.
    const canvas = document.createElement("canvas");
    canvas.width = width * factor;
    canvas.height = height * factor;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(result, 0, 0, canvas.width, canvas.height);

    const name = fileName();
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = name;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 0);
    }, "image/png");
    setOpen(false);
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (next) setFactor(defaultFactor(width, height));
        setOpen(next);
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={!result}
          className="max-sm:size-9 max-sm:px-0"
        >
          <Download aria-hidden="true" />
          <span className="sr-only sm:not-sr-only">Save</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        collisionPadding={16}
        aria-labelledby="save-title"
        className="flex w-80 flex-col gap-4"
      >
        <h2 id="save-title" className="font-display text-lg font-medium">
          Save image
        </h2>
        <div
          role="group"
          aria-label="Size"
          className="grid grid-cols-4 gap-1.5"
        >
          {FACTORS.map((k) => (
            <button
              key={k}
              type="button"
              aria-pressed={k === factor}
              aria-label={`${k}x, ${width * k} by ${height * k} pixels`}
              onClick={() => setFactor(k)}
              className={cn(
                "focus-visible:ring-safelight flex flex-col items-center gap-0.5 rounded-md border py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none",
                k === factor
                  ? "border-paper bg-paper text-ink"
                  : "border-input text-paper-dim hover:text-paper",
              )}
            >
              ×{k}
              <span className="text-readout">
                {width * k}×{height * k}
              </span>
            </button>
          ))}
        </div>
        <p className="text-paper-dim text-xs leading-relaxed">
          Enlarged without smoothing, so every pixel stays a crisp block. ×1 is
          the size the image was processed at.
        </p>
        <Button onClick={save} className="self-end">
          Save PNG
        </Button>
      </PopoverContent>
    </Popover>
  );
}
