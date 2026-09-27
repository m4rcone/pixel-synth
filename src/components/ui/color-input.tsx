import { cn } from "@/lib/utils";

/**
 * Native color picker drawn as a square swatch, the same everywhere in the
 * editor (custom palette, dot colors, background).
 */
export function ColorInput({
  className,
  ...props
}: Omit<React.ComponentProps<"input">, "type">) {
  return (
    <input
      type="color"
      className={cn(
        "border-line-strong block size-8 shrink-0 cursor-pointer border bg-transparent p-0.5 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
