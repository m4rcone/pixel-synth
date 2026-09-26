"use client";

import { CircleHelp } from "lucide-react";
import { useEditorState } from "@/contexts/editor-context";
import { bugReportUrl, FEATURE_IDEA_URL } from "@/lib/feedback";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const TIPS = [
  {
    title: "Processing scale",
    body: "Dithers a smaller copy of the image, then scales it back up to the original size. Lower values give bigger, chunkier grain.",
  },
  {
    title: "Error diffusion",
    body: "For error diffusion algorithms: how much of each pixel’s rounding error spreads to its neighbors. Lower values give flatter, cleaner areas with fewer stray dots.",
  },
  {
    title: "Palette",
    body: "Dithers straight to a set of colors. “Match by color” suits many-hued palettes; “Match by brightness” suits single-hue ones like Game Boy or sepia.",
  },
  {
    title: "Pixel art preset",
    body: "Shrinks the image to about 128 × 96 pixels’ worth of detail, whatever its shape, and applies PICO-8 with a 2×2 Bayer pattern. Save it ×4 or ×8 to share.",
  },
  {
    title: "1-bit dot colors",
    body: "In 1-bit mode, lit dots take the color of their brightness band (highlights, midtones, shadows). “Shade by brightness” darkens each color with the original pixel’s brightness.",
  },
  {
    title: "Background",
    body: "The color of the unlit dots in 1-bit mode. Make it transparent to save a dither you can lay over other artwork; the canvas shows a checkerboard behind it.",
  },
  {
    title: "Levels",
    body: "Black point and white point pick the tones that become pure black and pure white; gamma lightens or darkens the midtones. Small changes here reshape a dither more than any other filter. Sharpen brings out fine edges before dithering.",
  },
  {
    title: "Animated GIF",
    body: "Plays in the canvas. Once dithered, every frame shares one palette; save it as an animated GIF, or the shown frame as a PNG. Bayer and Blue Noise stay steady from frame to frame.",
  },
  {
    title: "Restore defaults",
    body: "Double-click a slider, or use the reset button next to its value.",
  },
  {
    title: "Canvas",
    body: "Drag to pan, scroll or pinch to zoom. With the canvas focused: arrow keys pan, + and − zoom, 0 resets the view. In an animation, comma and period step a frame, K plays or pauses.",
  },
];

const linkClass =
  "text-paper hover:text-safelight focus-visible:ring-safelight decoration-line-strong rounded-sm font-medium underline underline-offset-4 transition-colors focus-visible:ring-2 focus-visible:outline-none";

export function HelpPopover() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Editor help"
          className="text-paper-dim hover:text-paper hover:bg-accent focus-visible:ring-safelight grid size-9 place-items-center rounded-md transition-colors focus-visible:ring-2 focus-visible:outline-none"
        >
          <CircleHelp className="size-4.5" aria-hidden="true" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        aria-label="Editor help"
        className="max-h-(--radix-popover-content-available-height) w-80 overflow-y-auto text-sm"
      >
        <dl className="flex flex-col gap-3">
          {TIPS.map((tip) => (
            <div key={tip.title}>
              <dt className="font-medium">{tip.title}</dt>
              <dd className="text-paper-dim mt-0.5 leading-relaxed">
                {tip.body}
              </dd>
            </div>
          ))}
        </dl>
        <FeedbackLinks />
      </PopoverContent>
    </Popover>
  );
}

/** Rendered only while the popover is open, so the report reflects that moment. */
function FeedbackLinks() {
  const { settings, status, source, result } = useEditorState();
  const reportUrl = bugReportUrl({
    settings,
    status,
    source: source && {
      width: source.pixels.width,
      height: source.pixels.height,
    },
    result: result && { width: result.width, height: result.height },
    userAgent: typeof navigator === "undefined" ? "" : navigator.userAgent,
  });

  return (
    <div className="border-line mt-4 flex flex-col gap-2 border-t pt-3">
      <p className="text-paper-dim leading-relaxed">
        Found a bug or have an idea? Tell us on GitHub. Bug reports include your
        settings and browser, never your image.
      </p>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        <a
          href={reportUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={linkClass}
        >
          Report a bug
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
        <a
          href={FEATURE_IDEA_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={linkClass}
        >
          Suggest a feature
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
      </div>
    </div>
  );
}
