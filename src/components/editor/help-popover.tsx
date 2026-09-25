"use client";

import { CircleHelp } from "lucide-react";
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
    title: "Palette",
    body: "Dithers straight to a set of colors. “Match by color” suits many-hued palettes; “Match by brightness” suits single-hue ones like Game Boy or sepia.",
  },
  {
    title: "Pixel art preset",
    body: "Shrinks the image to 128 px wide, applies the PICO-8 palette with a 2×2 Bayer pattern. Save it ×4 or ×8 to share.",
  },
  {
    title: "Luminance",
    body: "Applies each tone color while preserving the original brightness of the pixel.",
  },
  {
    title: "Restore defaults",
    body: "Double-click a slider, or use the reset button next to its value.",
  },
  {
    title: "Canvas",
    body: "Drag to pan, scroll or pinch to zoom. With the canvas focused: arrow keys pan, + and − zoom, 0 resets the view.",
  },
];

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
        className="w-80 text-sm"
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
      </PopoverContent>
    </Popover>
  );
}
