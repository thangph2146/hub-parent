import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const flexVariants = cva("flex", {
  variants: {
    direction: {
      row: "flex-row",
      col: "flex-col",
    },
    align: {
      start: "items-start",
      center: "items-center",
      end: "items-end",
      stretch: "items-stretch",
    },
    justify: {
      start: "justify-start",
      center: "justify-center",
      end: "justify-end",
      between: "justify-between",
      around: "justify-around",
      evenly: "justify-evenly",
    },
    gap: {
      0: "gap-0",
      0.5: "gap-0.5",
      1: "gap-1",
      1.5: "gap-1.5",
      2: "gap-2",
      3: "gap-3",
      4: "gap-4",
      5: "gap-5",
      6: "gap-6",
      8: "gap-8",
      12: "gap-12",
      16: "gap-16",
    },
    wrap: {
      true: "flex-wrap",
      false: "flex-nowrap",
    },
    fullWidth: {
      true: "w-full",
      false: "",
    },
    container: {
      true: "container mx-auto",
      false: "",
    },
    padding: {
      none: "",
      xs: "p-1",
      sm: "p-2",
      md: "p-4",
      lg: "p-6",
      xl: "p-8",
      "xs-x": "px-1",
      "sm-x": "px-2",
      "md-x": "px-4",
      "lg-x": "px-6",
      "xs-y": "py-1",
      "sm-y": "py-2",
      "md-y": "py-4",
      "lg-y": "py-6",
      "responsive": "px-4 sm:px-6 lg:px-8",
      "responsive-y": "py-4 sm:py-6 lg:py-8",
      "responsive-full": "px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8",
      "responsive-lg": "px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16",
    },
    margin: {
      none: "",
      auto: "mx-auto",
      "y-auto": "my-auto",
    },
    position: {
      relative: "relative",
      absolute: "absolute",
      fixed: "fixed",
      sticky: "sticky",
      static: "static",
    },
  },
  defaultVariants: {
    direction: "row",
    align: "start",
    justify: "start",
    gap: 0,
    wrap: false,
    fullWidth: false,
    container: false,
    padding: "none",
    margin: "none",
    position: "static",
  },
})

export interface FlexProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof flexVariants> {
  as?: React.ElementType
}

export const Flex = React.forwardRef<HTMLDivElement, FlexProps>(
  ({ className, direction, align, justify, gap, wrap, fullWidth, container, padding, margin, position, as: Component = "div", ...props }, ref) => {
    return (
      <Component
        ref={ref}
        className={cn(flexVariants({ direction, align, justify, gap, wrap, fullWidth, container, padding, margin, position }), className)}
        {...props}
      />
    )
  }
)

Flex.displayName = "Flex"

