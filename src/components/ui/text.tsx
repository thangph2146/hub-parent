import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { typography, textColors } from "@/lib/typography"

const textVariants = cva("", {
  variants: {
    variant: {
      // Body variants
      "body-small": typography.body.small,
      "body-medium": typography.body.medium,
      "body-large": typography.body.large,
      "body-small-muted": typography.body.muted.small,
      "body-medium-muted": typography.body.muted.medium,
      "body-large-muted": typography.body.muted.large,
      // Heading variants
      "heading-h1": typography.heading.h1,
      "heading-h2": typography.heading.h2,
      "heading-h3": typography.heading.h3,
      "heading-h4": typography.heading.h4,
      "heading-h5": typography.heading.h5,
      "heading-h6": typography.heading.h6,
      "heading-h1-primary": typography.heading.primary.h1,
      "heading-h2-primary": typography.heading.primary.h2,
      "heading-h3-primary": typography.heading.primary.h3,
      // Title variants
      "title-default": typography.title.default,
      "title-large": typography.title.large,
      "title-small": typography.title.small,
      // Description variants
      "description-default": typography.description.default,
      "description-small": typography.description.small,
      "description-large": typography.description.large,
    },
    color: {
      foreground: textColors.foreground,
      muted: textColors.muted,
      primary: textColors.primary,
      secondary: textColors.secondary,
      accent: textColors.accent,
      destructive: textColors.destructive,
    },
  },
  defaultVariants: {
    variant: "body-medium",
  },
})

export interface TextProps
  extends Omit<React.HTMLAttributes<HTMLElement>, "color">,
    VariantProps<typeof textVariants> {
  as?: "p" | "span" | "div" | "label" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6"
}

const Text = React.forwardRef<HTMLElement, TextProps>(
  ({ className, variant, color, as, ...props }, ref) => {
    const Component = as || "span"
    return (
      <Component
        ref={ref as never}
        className={cn(textVariants({ variant, color: color as VariantProps<typeof textVariants>["color"] }), className)}
        {...props}
      />
    )
  }
)
Text.displayName = "Text"

export { Text, textVariants }

