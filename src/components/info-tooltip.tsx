"use client";

import { useState } from "react";
import { CircleQuestionMark } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function InfoTooltip() {
  const [open, setOpen] = useState(false);

  return (
    <Tooltip open={open} onOpenChange={setOpen}>
      <TooltipTrigger asChild>
        <CircleQuestionMark
          width={18}
          height={18}
          onClick={() => setOpen((prev) => !prev)}
          className="cursor-help"
        />
      </TooltipTrigger>
      <TooltipContent className="mr-4 flex w-[290px] flex-col gap-1">
        <div>
          <p className="font-semibold">✦ Dither Controls</p>
          <p>
            Temporarily scales the image before applying dithering, then
            restores the original size.
          </p>
        </div>
        <div>
          <p className="font-semibold">✦ Luminance</p>
          <p>
            Applies the color while preserving the original relative luminance
            of the pixel.
          </p>
        </div>
        <p>
          <span className="font-semibold">✦ Double-click</span> to restore
          default value.
        </p>
      </TooltipContent>
    </Tooltip>
  );
}
