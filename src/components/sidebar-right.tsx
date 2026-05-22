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
      <SidebarHeader className="border-sidebar-border flex h-14 flex-row items-center justify-between border-b px-3">
        <SidebarGroupLabel className="text-foreground px-0 text-sm">
          Control Panel
        </SidebarGroupLabel>
        <InfoTooltip />
      </SidebarHeader>
      <SidebarContent
        aria-label="Editor control groups"
        tabIndex={0}
        className="focus-visible:ring-ring gap-0 focus-visible:ring-2 focus-visible:outline-hidden"
      >
        <SidebarGroupLabel className="mt-2 flex justify-center gap-1 text-sm">
          <Settings />
          Dither Controls
        </SidebarGroupLabel>
        <div className="mb-3 flex flex-col gap-2 px-3">
          <SelectAlgorithm />
          <SliderScale />
        </div>
        <SidebarSeparator className="mx-0 my-2" />
        <SidebarGroupLabel className="flex justify-center gap-1 text-sm">
          <SlidersHorizontal />
          Filter Controls
        </SidebarGroupLabel>
        <div className="mb-3 px-3">
          <FilterControls />
        </div>
        <SidebarSeparator className="mx-0 my-2" />
        <SidebarGroupLabel className="flex justify-center gap-1 text-sm">
          <Palette />
          Tone Controls
        </SidebarGroupLabel>
        <div className="mb-3 px-3">
          <ToneControls />
        </div>
      </SidebarContent>
      <SidebarFooter className="border-t px-3">
        <ControlPanelActions />
      </SidebarFooter>
    </Sidebar>
  );
}
