import { cn } from "@/lib/utils";
import { ControlPanelActions } from "./control-panel-actions";
import { DitherControls } from "./dither-controls";
import { FilterControls } from "./filter-controls";
import { HelpPopover } from "./help-popover";
import { ShareSettings } from "./share-settings";
import { ColorControls } from "./color-controls";

const SECTIONS: {
  id: string;
  title: string;
  Controls: () => React.ReactNode;
}[] = [
  { id: "dither", title: "Dither", Controls: DitherControls },
  // Color shapes the look most, so it comes before the fine-tuning filters.
  { id: "color", title: "Color", Controls: ColorControls },
  { id: "filters", title: "Filters", Controls: FilterControls },
];

/**
 * The editor's only control panel. It is rendered once and laid out by CSS:
 * below the canvas on small screens, as a fixed-width column on large ones.
 */
export function ControlPanel({ className }: { className?: string }) {
  return (
    <section
      aria-labelledby="control-panel-heading"
      className={cn("bg-ink-raised scanlines flex flex-col", className)}
    >
      <header className="border-line flex h-14 shrink-0 items-center justify-between border-b px-4">
        <h2
          id="control-panel-heading"
          className="text-caps text-paper font-semibold"
        >
          Control panel
        </h2>
        <div className="flex items-center gap-1">
          <ShareSettings />
          <HelpPopover />
        </div>
      </header>

      {/* Scrollable on large screens; focusable so keyboard users can scroll it. */}
      <div
        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
        tabIndex={0}
        className="focus-visible:ring-ring relative flex flex-1 flex-col focus-visible:ring-2 focus-visible:outline-hidden focus-visible:ring-inset lg:overflow-y-auto"
      >
        {SECTIONS.map(({ id, title, Controls }) => (
          <section
            key={id}
            aria-labelledby={`panel-${id}-heading`}
            className="border-line flex flex-col gap-3 border-b px-4 py-4 last:border-b-0"
          >
            <h3
              id={`panel-${id}-heading`}
              className="text-caps text-paper flex items-center gap-2 font-semibold"
            >
              {title}
            </h3>
            <Controls />
          </section>
        ))}
      </div>

      <ControlPanelActions />
    </section>
  );
}
