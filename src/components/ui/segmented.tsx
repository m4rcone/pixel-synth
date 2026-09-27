"use client";

import { cn } from "@/lib/utils";

type SegmentedProps<T extends string> = {
  /** Accessible name of the group. */
  label: string;
  options: readonly { value: T; label: string; disabled?: boolean }[];
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
        "border-input inline-flex w-full gap-0.5 border p-0.5",
        disabled && "opacity-45",
        className,
      )}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={option.value === value}
          disabled={disabled || option.disabled}
          onClick={() => option.value !== value && onChange(option.value)}
          className={cn(
            "focus-visible:outline-safelight h-8 flex-1 px-3 text-sm font-medium transition-colors outline-none focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed",
            option.disabled && !disabled && "opacity-45",
            option.value === value
              ? "bg-paper text-ink"
              : "text-paper-dim hover:text-paper-hot",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
