import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap text-xs font-semibold uppercase tracking-caps transition-colors outline-none disabled:pointer-events-none disabled:opacity-45 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-safelight aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        // Solid plate with the bottom-right corner cut.
        default: "btn-notch text-ink",
        destructive: "bg-destructive text-paper hover:bg-destructive/85",
        outline: "text-paper hover:text-paper-hot",
        secondary: "bg-secondary text-secondary-foreground hover:bg-accent",
        ghost: "text-paper-dim hover:bg-accent hover:text-paper",
        link: "text-paper underline decoration-line-strong underline-offset-4 hover:text-paper-hot hover:decoration-paper-hot",
      },
      size: {
        default: "h-9 px-4 has-[>svg]:px-3",
        sm: "h-8 gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-11 px-5 has-[>svg]:px-4",
        icon: "size-9",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    // Extra room on the right for the cut corner (after the size padding).
    compoundVariants: [
      {
        variant: "default",
        size: ["default", "sm", "lg"],
        className: "pr-6 has-[>svg]:pr-5",
      },
      // Corner brackets over a faint frame; icon buttons get a plain frame.
      {
        variant: "outline",
        size: ["default", "sm", "lg"],
        className: "btn-brackets",
      },
      {
        variant: "outline",
        size: ["icon", "icon-sm", "icon-lg"],
        className: "border-line-strong hover:border-paper border",
      },
    ],
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
