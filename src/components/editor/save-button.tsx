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
  const [saving, setSaving] = useState(false);

  const width = result?.width ?? 0;
  const height = result?.height ?? 0;

  function fileName() {
    if (status !== "dithered") return "pixelsynth-filtered.png";
    const palette =
      settings.color.mode === "palette" ? `-${settings.color.palette}` : "";
    const size = factor > 1 ? `-${factor}x` : "";
    return `pixelsynth-${settings.algorithm}${palette}${size}.png`;
  }

  function fail() {
    setError(
      `Your browser couldn’t create a ${width * factor} × ${height * factor} image. Choose a smaller size.`,
    );
  }

  async function save() {
    if (!result) return;
    setError(null);
    setSaving(true);
    try {
      // Indexed PNG first (dithered output has few colors); the canvas PNG
      // covers images with more than 256 colors and browsers without
      // CompressionStream.
      const blob =
        (await indexedPng(result, factor).catch(() => null)) ??
        (await canvasPng(result, factor));
      if (!blob) return fail();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName();
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 0);
      setOpen(false);
    } catch {
      fail();
    } finally {
      setSaving(false);
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
        <Button onClick={save} disabled={saving} className="self-end">
          {saving ? "Saving…" : "Save PNG"}
        </Button>
      </PopoverContent>
    </Popover>
  );
}

/** The rendered image as an indexed PNG, or null past 256 colors. */
async function indexedPng(result: ImageBitmap, factor: number) {
  const { width, height } = result;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(result, 0, 0);
  const { data } = ctx.getImageData(0, 0, width, height);
  // Loaded on demand: only needed when saving.
  const { encodeIndexedPng } = await import("@/lib/editor/png");
  return encodeIndexedPng({ data, width, height }, factor);
}

/**
 * The browser's own RGBA PNG, enlarged on a canvas without smoothing so each
 * pixel becomes a crisp block. Null past the browser's canvas limits, where
 * browsers fail silently (a null context or blob).
 */
function canvasPng(result: ImageBitmap, factor: number): Promise<Blob | null> {
  const canvas = document.createElement("canvas");
  canvas.width = result.width * factor;
  canvas.height = result.height * factor;
  const ctx = canvas.getContext("2d");
  if (!ctx) return Promise.resolve(null);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(result, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve) =>
    canvas.toBlob((blob) => {
      // Release the (possibly huge) canvas memory right away.
      canvas.width = canvas.height = 0;
      resolve(blob);
    }, "image/png"),
  );
}
