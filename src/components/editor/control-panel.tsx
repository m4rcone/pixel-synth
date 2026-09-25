import type { LucideIcon } from "lucide-react";
import { Palette, Settings2, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { ControlPanelActions } from "./control-panel-actions";
import { DitherControls } from "./dither-controls";
import { FilterControls } from "./filter-controls";
import { InfoTooltip } from "./info-tooltip";
import { ToneControls } from "./tone-controls";

const SECTIONS: {
  id: string;
  title: string;
  icon: LucideIcon;
  Controls: () => React.ReactNode;
}[] = [
  { id: "dither", title: "Dither", icon: Settings2, Controls: DitherControls },
  {
    id: "filters",
    title: "Filters",
    icon: SlidersHorizontal,
    Controls: FilterControls,
  },
  { id: "tone", title: "Tone", icon: Palette, Controls: ToneControls },
];

/**
 * The editor's only control panel. It is rendered once and laid out by CSS:
 * below the canvas on small screens, as a fixed-width column on large ones.
 */
export function ControlPanel({ className }: { className?: string }) {
  return (
    <section
      aria-labelledby="control-panel-heading"
      className={cn("bg-ink flex flex-col", className)}
    >
      <header className="border-line flex h-14 shrink-0 items-center justify-between border-b px-4">
        <h2
          id="control-panel-heading"
          className="font-display flex items-center gap-2 text-lg tracking-tight"
        >
          <span
            aria-hidden="true"
            className="lab-blink bg-safelight size-1.5 rounded-full"
          />
          Control panel
        </h2>
        <InfoTooltip />
      </header>

      {/* Scrollable on large screens; focusable so keyboard users can scroll it. */}
      <div
        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
        tabIndex={0}
        className="focus-visible:ring-ring flex flex-1 flex-col focus-visible:ring-2 focus-visible:outline-hidden focus-visible:ring-inset lg:overflow-y-auto"
      >
        {SECTIONS.map(({ id, title, icon: Icon, Controls }) => (
          <section
            key={id}
            aria-labelledby={`panel-${id}-heading`}
            className="border-line flex flex-col gap-3 border-b px-4 py-4 last:border-b-0"
          >
            <h3
              id={`panel-${id}-heading`}
              className="text-label text-paper-dim flex items-center gap-1.5"
            >
              <Icon className="text-safelight size-3.5" aria-hidden="true" />
              {title}
            </h3>
            <Controls />
          </section>
        ))}
      </div>

      <footer className="border-line bg-ink sticky bottom-0 border-t p-3 lg:static">
        <ControlPanelActions />
      </footer>
    </section>
  );
}
