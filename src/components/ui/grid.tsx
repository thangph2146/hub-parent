import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const gridVariants = cva("grid [&>*]:min-w-0 [&>*]:w-full", {
  variants: {
    cols: {
      1: "grid-cols-1",
      2: "grid-cols-1 sm:grid-cols-2",
      "2-lg": "grid-cols-1 lg:grid-cols-2",
      3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
      4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
      5: "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5",
      6: "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6",
    },
    gap: {
      0: "gap-0",
      1: "gap-1",
      2: "gap-2",
      3: "gap-3",
      4: "gap-4",
      6: "gap-6",
      8: "gap-8",
      12: "gap-12",
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
  },
  defaultVariants: {
    cols: 1,
    gap: 0,
    align: "stretch",
    justify: "start",
    fullWidth: false,
    container: false,
    padding: "none",
    margin: "none",
  },
})

export interface GridProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof gridVariants> {}

export const Grid = React.forwardRef<HTMLDivElement, GridProps>(
  ({ className, cols, gap, align, justify, fullWidth, container, padding, margin, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(gridVariants({ cols, gap, align, justify, fullWidth, container, padding, margin }), className)}
        {...props}
      />
    )
  }
)

Grid.displayName = "Grid"

