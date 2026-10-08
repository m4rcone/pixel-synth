"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { useCanvasContext } from "@/contexts/canvas-context";
import {
  frameResult,
  useEditorActions,
  useEditorState,
} from "@/contexts/editor-context";
import { Button } from "@/components/ui/button";
import { track } from "@/lib/track";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Segmented } from "@/components/ui/segmented";
import {
  defaultExportFactor,
  defaultGifFactor,
  EXPORT_FACTORS,
  exportFits,
  gifExportFits,
  type ExportFactor,
} from "@/lib/editor/export";
import { TooManyColorsError } from "@/lib/editor/gif/errors";
import type { Pixels } from "@/lib/editor/pixels";
import { siteConfig } from "@/lib/site";
import { cn } from "@/lib/utils";

type Format = "gif" | "png";

export function SaveButton() {
  const state = useEditorState();
  const { result, resultFrames, settings, source, renderProgress } = state;
  const { encodeGif } = useEditorActions();
  const { frame } = useCanvasContext();
  const [open, setOpen] = useState(false);
  const [format, setFormat] = useState<Format>("png");
  const [factor, setFactor] = useState<ExportFactor>(1);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);

  const animation = source?.animation;
  const frameCount = animation?.frames.length ?? 1;
  // PNG saves the shown frame (the only one of a still image).
  const still = frameResult(state, frame) ?? result;
  const gifFrames =
    !renderProgress && resultFrames?.every(Boolean)
      ? (resultFrames as ImageBitmap[])
      : null;
  const gifHint =
    animation && !gifFrames
      ? "Wait for every frame to render to save a GIF."
      : null;
  const saveGif = format === "gif" && !!gifFrames;

  const width = (saveGif ? gifFrames[0] : still)?.width ?? 0;
  const height = (saveGif ? gifFrames[0] : still)?.height ?? 0;
  const fits = (k: number) =>
    saveGif
      ? gifExportFits(width, height, frameCount, k)
      : exportFits(width, height, k);

  function fileName(extension: string) {
    const { mode } = settings.color;
    const palette =
      mode === "palette"
        ? `-${settings.color.palette}`
        : mode === "cmyk"
          ? "-cmyk"
          : "";
    const size = factor > 1 ? `-${factor}x` : "";
    return `pixelsynth-${settings.algorithm}${palette}${size}.${extension}`;
  }

  function fail() {
    setError(
      `Your browser couldn’t create a ${width * factor} × ${height * factor} image. Choose a smaller size.`,
    );
  }

  function download(blob: Blob, name: string) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    link.click();
    // Revoking right away can cancel a large download in Safari.
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
    setOpen(false);
  }

  async function save() {
    setError(null);
    setSaving(true);
    try {
      if (saveGif) {
        setProgress(0);
        const bytes = await encodeGif(
          readPixels(gifFrames),
          factor,
          (done, total) => setProgress(done / total),
        );
        download(new Blob([bytes], { type: "image/gif" }), fileName("gif"));
        return track("export", { format: "gif", scale: factor });
      }
      if (!still) return;
      // Indexed PNG first (dithered output has few colors); the canvas PNG
      // covers images with more than 256 colors and browsers without
      // CompressionStream.
      const blob =
        (await indexedPng(still, factor).catch(() => null)) ??
        (await canvasPng(still, factor));
      if (!blob) return fail();
      download(blob, fileName("png"));
      track("export", { format: "png", scale: factor });
    } catch (error) {
      if (error instanceof TooManyColorsError) {
        setError(
          "These frames use more than 256 colors, the most a GIF holds.",
        );
      } else {
        fail();
      }
    } finally {
      setSaving(false);
      setProgress(null);
    }
  }

  const tooLarge = EXPORT_FACTORS.filter((k) => !fits(k));

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (next) {
          setFormat(gifFrames ? "gif" : "png");
          setFactor(
            gifFrames
              ? defaultGifFactor(
                  gifFrames[0].width,
                  gifFrames[0].height,
                  frameCount,
                )
              : defaultExportFactor(still?.width ?? 0, still?.height ?? 0),
          );
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
          {/* Icon-only on phones, where the toolbar is tight; a label from sm up. */}
          <Download className="sm:hidden" aria-hidden="true" />
          <span className="sr-only sm:not-sr-only">Save</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        collisionPadding={16}
        aria-labelledby="save-title"
        className="flex w-80 flex-col gap-4"
      >
        <h2 id="save-title" className="text-heading font-semibold">
          {animation ? "Save animation" : "Save image"}
        </h2>
        {animation && (
          <div className="flex flex-col gap-2">
            <Segmented
              label="Format"
              options={[
                { value: "gif", label: "Animated GIF", disabled: !gifFrames },
                { value: "png", label: "PNG (this frame)" },
              ]}
              value={saveGif ? "gif" : "png"}
              onChange={(next) => {
                setFormat(next);
                setError(null);
                if (next === "gif" && gifFrames) {
                  const [first] = gifFrames;
                  setFactor(
                    defaultGifFactor(first.width, first.height, frameCount),
                  );
                } else if (still) {
                  setFactor(defaultExportFactor(still.width, still.height));
                }
              }}
            />
            {gifHint && <p className="text-paper-dim text-hint">{gifHint}</p>}
          </div>
        )}
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
                "focus-visible:ring-safelight flex items-baseline justify-between gap-2 border px-3 py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none",
                k === factor
                  ? "border-paper bg-paper text-ink"
                  : "border-input text-paper-dim hover:text-paper-hot",
              )}
            >
              ×{k}
              <span className="text-readout">
                {width * k}×{height * k}
              </span>
            </button>
          ))}
        </div>
        <p className="text-paper-dim text-hint">
          {saveGif &&
            `${frameCount} frames at ${width * factor} × ${height * factor} px. `}
          Enlarged without smoothing, so every pixel stays a crisp block. ×1 is
          the size the image was processed at.
          {tooLarge.length > 0 &&
            ` ×${tooLarge.join(", ×")} ${tooLarge.length > 1 ? "are" : "is"} too large ${saveGif ? "for a GIF this long" : "for browsers to draw"}.`}
        </p>
        {error && (
          <p role="alert" className="text-danger text-xs leading-relaxed">
            {error}
          </p>
        )}
        <div className="border-line flex items-center justify-between gap-3 border-t pt-4">
          <p className="text-paper-dim text-hint">
            Free to use.{" "}
            <a
              href={siteConfig.links.support}
              target="_blank"
              rel="noopener noreferrer"
              className="text-paper hover:text-paper-hot focus-visible:ring-safelight underline underline-offset-4 transition-colors focus-visible:ring-2 focus-visible:outline-none"
            >
              Support it on Ko-fi
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </p>
          <Button onClick={save} disabled={saving} className="shrink-0">
            {saving
              ? progress === null
                ? "Saving…"
                : `Saving… ${Math.round(progress * 100)}%`
              : saveGif
                ? "Save GIF"
                : "Save PNG"}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

/** RGBA pixels of rendered frames, read back through one canvas. */
function readPixels(bitmaps: ImageBitmap[]): Pixels[] {
  const { width, height } = bitmaps[0];
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Canvas unavailable");
  return bitmaps.map((bitmap) => {
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(bitmap, 0, 0);
    return { data: ctx.getImageData(0, 0, width, height).data, width, height };
  });
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
