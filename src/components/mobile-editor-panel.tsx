"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import { SelectAlgorithm } from "./select-algorithm";
import { SliderScale } from "./slider-scale";
import { FilterControls } from "./filter-controls";
import { ToneControls } from "./tone-controls";
import { ControlPanelActions } from "./control-panel-actions";
import { Blend, Settings, SlidersHorizontal } from "lucide-react";
import { InfoTooltip } from "./info-tooltip";

export function MobileEditorPanel() {
  return (
    <section className="bg-background flex flex-col gap-1 border-t px-6 py-2">
      <div className="mt-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold tracking-wide">
          Control Panel
        </h2>
        <InfoTooltip />
      </div>

      <Separator className="mt-2" />

      <Accordion
        type="multiple"
        defaultValue={["dither", "filter", "tone"]}
        className="w-full"
      >
        <AccordionItem value="dither">
          <AccordionTrigger className="flex items-center gap-1 py-2 text-sm">
            <Settings className="h-4 w-4" />
            Dither Controls
          </AccordionTrigger>
          <AccordionContent className="flex flex-col gap-2 pt-1">
            <SelectAlgorithm />
            <SliderScale />
          </AccordionContent>
        </AccordionItem>

        <Separator />

        <AccordionItem value="filter">
          <AccordionTrigger className="flex items-center gap-1 py-2 text-sm">
            <SlidersHorizontal className="h-4 w-4" />
            Filter Controls
          </AccordionTrigger>
          <AccordionContent className="pt-1">
            <FilterControls />
          </AccordionContent>
        </AccordionItem>

        <Separator />

        <AccordionItem value="tone">
          <AccordionTrigger className="flex items-center gap-1 py-2 text-sm">
            <Blend className="h-4 w-4" />
            Tone Controls
          </AccordionTrigger>
          <AccordionContent className="pt-1">
            <ToneControls />
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <Separator className="mb-2" />

      <ControlPanelActions />
    </section>
  );
}
