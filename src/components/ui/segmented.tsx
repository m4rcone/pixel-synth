"use client";

import { cn } from "@/lib/utils";

type SegmentedProps<T extends string> = {
  /** Accessible name of the group. */
  label: string;
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
  className?: string;
};

/** A small set of mutually exclusive toggle buttons. */
export function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
  disabled = false,
  className,
}: SegmentedProps<T>) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn(
        "border-input inline-flex w-full gap-0.5 rounded-md border p-0.5",
        disabled && "opacity-45",
        className,
      )}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={option.value === value}
          disabled={disabled}
          onClick={() => option.value !== value && onChange(option.value)}
          className={cn(
            "focus-visible:ring-safelight h-8 flex-1 rounded-sm px-3 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed",
            option.value === value
              ? "bg-paper text-ink"
              : "text-paper-dim hover:text-paper",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
