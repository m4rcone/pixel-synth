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
import {
  defaultExportFactor,
  EXPORT_FACTORS,
  exportFits,
  type ExportFactor,
} from "@/lib/editor/export";
import { cn } from "@/lib/utils";

export function SaveButton() {
  const { status, result, settings } = useEditorState();
  const [open, setOpen] = useState(false);
  const [factor, setFactor] = useState<ExportFactor>(1);
  const [error, setError] = useState<string | null>(null);

  const width = result?.width ?? 0;
  const height = result?.height ?? 0;

  function fileName() {
    if (status !== "dithered") return "pixelsynth-filtered.png";
    const palette =
      settings.color.mode === "palette" ? `-${settings.color.palette}` : "";
    const size = factor > 1 ? `-${factor}x` : "";
    return `pixelsynth-${settings.algorithm}${palette}${size}.png`;
  }

  // Browsers fail silently past their canvas limits (a null context or
  // blob): say so and keep the dialog open to pick a smaller size.
  function fail() {
    setError(
      `Your browser couldn’t create a ${width * factor} × ${height * factor} image. Choose a smaller size.`,
    );
  }

  function save() {
    if (!result) return;
    setError(null);
    // Enlarge without smoothing: each pixel becomes a crisp k×k block.
    const canvas = document.createElement("canvas");
    canvas.width = width * factor;
    canvas.height = height * factor;
    const name = fileName();
    try {
      const ctx = canvas.getContext("2d");
      if (!ctx) return fail();
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(result, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        // Release the (possibly huge) canvas memory right away.
        canvas.width = canvas.height = 0;
        if (!blob) return fail();
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = name;
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 0);
        setOpen(false);
      }, "image/png");
    } catch {
      fail();
    }
  }

  const tooLarge = EXPORT_FACTORS.filter((k) => !exportFits(width, height, k));

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (next) {
          setFactor(defaultExportFactor(width, height));
          setError(null);
        }
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
          className="grid grid-cols-2 gap-1.5"
        >
          {EXPORT_FACTORS.map((k) => (
            <button
              key={k}
              type="button"
              aria-pressed={k === factor}
              aria-label={`${k}x, ${width * k} by ${height * k} pixels`}
              disabled={tooLarge.includes(k)}
              onClick={() => {
                setFactor(k);
                setError(null);
              }}
              className={cn(
                "disabled:cursor-not-allowed disabled:opacity-45",
                "focus-visible:ring-safelight flex items-baseline justify-between gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none",
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
          {tooLarge.length > 0 &&
            ` ×${tooLarge.join(", ×")} ${tooLarge.length > 1 ? "are" : "is"} too large for browsers to draw.`}
        </p>
        {error && (
          <p role="alert" className="text-safelight text-xs leading-relaxed">
            {error}
          </p>
        )}
        <Button onClick={save} className="self-end">
          Save PNG
        </Button>
      </PopoverContent>
    </Popover>
  );
}
