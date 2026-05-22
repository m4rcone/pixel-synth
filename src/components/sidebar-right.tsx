import * as React from "react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { SelectAlgorithm } from "./select-algorithm";
import { SliderScale } from "./slider-scale";
import { FilterControls } from "./filter-controls";
import { ToneControls } from "./tone-controls";
import { ControlPanelActions } from "./control-panel-actions";
import { Palette, Settings, SlidersHorizontal } from "lucide-react";
import { InfoTooltip } from "./info-tooltip";

export function SidebarRight({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar
      collapsible="none"
      className="bg-background fixed top-0 right-0 z-40 hidden h-svh w-80 border-l lg:flex"
      {...props}
    >
      <SidebarHeader className="flex h-14 flex-row items-center justify-between border-b border-[var(--line)] px-4">
        <div className="flex items-center gap-2">
          <span className="lab-blink size-1.5 rounded-full bg-[var(--safelight)]" />
          <span className="font-display text-base tracking-tight">
            Control Panel
          </span>
        </div>
        <InfoTooltip />
      </SidebarHeader>
      <SidebarContent
        aria-label="Editor control groups"
        tabIndex={0}
        className="focus-visible:ring-ring gap-0 py-2 focus-visible:ring-2 focus-visible:outline-hidden"
      >
        <SidebarGroupLabel className="font-mono mt-1 flex items-center gap-1.5 px-4 text-[10px] tracking-[0.18em] text-[var(--paper-dim)] uppercase">
          <Settings className="size-3.5 text-[var(--safelight)]" />
          Dither
        </SidebarGroupLabel>
        <div className="mb-3 flex flex-col gap-3 px-4">
          <SelectAlgorithm />
          <SliderScale />
        </div>
        <SidebarSeparator className="mx-0 my-2 bg-[var(--line)]" />
        <SidebarGroupLabel className="font-mono flex items-center gap-1.5 px-4 text-[10px] tracking-[0.18em] text-[var(--paper-dim)] uppercase">
          <SlidersHorizontal className="size-3.5 text-[var(--safelight)]" />
          Filters
        </SidebarGroupLabel>
        <div className="mb-3 px-4">
          <FilterControls />
        </div>
        <SidebarSeparator className="mx-0 my-2 bg-[var(--line)]" />
        <SidebarGroupLabel className="font-mono flex items-center gap-1.5 px-4 text-[10px] tracking-[0.18em] text-[var(--paper-dim)] uppercase">
          <Palette className="size-3.5 text-[var(--safelight)]" />
          Tone
        </SidebarGroupLabel>
        <div className="mb-3 px-4">
          <ToneControls />
        </div>
      </SidebarContent>
      <SidebarFooter className="border-t px-3">
        <ControlPanelActions />
      </SidebarFooter>
    </Sidebar>
  );
}
