import { cn } from "@/lib/utils";

// A left-to-right ramp through a 4×4 Bayer matrix: the mark is literally the
// output of an ordered-dither threshold map. Same cells as app/icon.svg.
const CELLS: [number, number][] = [
  [0, 0],
  [2, 0],
  [3, 0],
  [1, 1],
  [3, 1],
  [2, 2],
  [3, 2],
  [3, 3],
];

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={cn("size-6 shrink-0", className)}
    >
      <rect
        x="0.5"
        y="0.5"
        width="23"
        height="23"
        fill="none"
        stroke="var(--line-strong)"
      />
      <g fill="currentColor">
        {CELLS.map(([x, y]) => (
          <rect
            key={`${x}-${y}`}
            x={4 + x * 4}
            y={4 + y * 4}
            width="4"
            height="4"
          />
        ))}
      </g>
    </svg>
  );
}

/** Mark + wordmark. The visible name doubles as the link's accessible name. */
export function Logo({
  className,
  wordmarkClassName,
}: {
  className?: string;
  wordmarkClassName?: string;
}) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <LogoMark />
      <span
        className={cn(
          "tracking-caps text-sm leading-none font-semibold uppercase",
          wordmarkClassName,
        )}
      >
        PixelSynth
      </span>
    </span>
  );
}
