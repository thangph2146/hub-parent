"use client"

import * as React from "react"
import * as SeparatorPrimitive from "@radix-ui/react-separator"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const separatorVariants = cva("shrink-0", {
  variants: {
    orientation: {
      horizontal: "h-px w-full",
      vertical: "h-full w-[1px] min-w-[1px]",
    },
    variant: {
      default: "bg-border",
      gradient: "bg-gradient-to-r from-transparent via-border to-transparent",
      gradientWhite: "bg-gradient-to-r from-transparent via-white/20 to-transparent",
    },
  },
  defaultVariants: {
    orientation: "horizontal",
    variant: "default",
  },
})

export interface SeparatorProps
  extends Omit<React.ComponentProps<typeof SeparatorPrimitive.Root>, "orientation">,
    Omit<VariantProps<typeof separatorVariants>, "orientation"> {
  orientation?: "horizontal" | "vertical"
}

const Separator = React.forwardRef<
  React.ElementRef<typeof SeparatorPrimitive.Root>,
  SeparatorProps
>(({ className, orientation = "horizontal", variant = "default", decorative = true, ...props }, ref) => (
  <SeparatorPrimitive.Root
    ref={ref}
    data-slot="separator"
    decorative={decorative}
    orientation={orientation}
    className={cn(separatorVariants({ orientation, variant }), className)}
    {...props}
  />
))

Separator.displayName = "Separator"

export { Separator }
