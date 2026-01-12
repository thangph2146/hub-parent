import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/utils"

const createGapVariants = (prefix = "gap") => ({
  0: `${prefix}-0`,
  1: `${prefix}-1`,
  2: `${prefix}-2`,
  3: `${prefix}-3`,
  4: `${prefix}-4`,
  6: `${prefix}-6`,
  8: `${prefix}-8`,
  12: `${prefix}-12`,
  16: `${prefix}-16`,
})

const createSpacingVariants = (prefix: "px" | "py" | "mx" | "my") => {
  const base: Record<string, string> = { none: "" }
  const values = [0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16]
  values.forEach(v => base[v] = `${prefix}-${v}`)
  return base
}

const gridVariants = cva("grid [&>*]:min-w-0 [&>*]:w-full", {
  variants: {
    cols: {
      1: "grid-cols-1",
      2: "grid-cols-1 sm:grid-cols-2",
      "2-lg": "grid-cols-1 lg:grid-cols-2",
      "2-md": "grid-cols-1 md:grid-cols-2",
      "2-sm": "grid-cols-1 sm:grid-cols-2",
      3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
      "3-md": "grid-cols-1 md:grid-cols-3",
      "3-lg": "grid-cols-1 lg:grid-cols-3",
      4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
      "4-md": "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
      "4-lg": "grid-cols-1 lg:grid-cols-4",
      5: "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5",
      6: "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6",
      "responsive-2": "grid-cols-1 sm:grid-cols-2",
      "responsive-3": "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
      "responsive-4": "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
    },
    gap: {
      ...createGapVariants(),
      "6-lg-8": "gap-6 lg:gap-8",
      "2-md-4": "gap-2 md:gap-4",
      "2-lg-6": "gap-2 lg:gap-6",
      "4-lg-6": "gap-4 lg:gap-6",
      "4-lg-8": "gap-4 lg:gap-8",
      responsive: "gap-2 sm:gap-4 md:gap-5 lg:gap-6 xl:gap-8 2xl:gap-8",
    },
    gapX: { none: "", ...createGapVariants("gap-x") },
    gapY: { none: "", ...createGapVariants("gap-y") },
    align: {
      start: "items-start",
      center: "items-center",
      end: "items-end",
      stretch: "items-stretch",
      top: "items-start",
      middle: "items-center",
      bottom: "items-end",
    },
    justify: {
      start: "justify-start",
      center: "justify-center",
      end: "justify-end",
      between: "justify-between",
      around: "justify-around",
      evenly: "justify-evenly",
    },
    wrap: { true: "flex-wrap", false: "flex-nowrap" },
    fullWidth: { true: "w-full", false: "" },
    container: { true: "container mx-auto", false: "" },
    padding: {
      none: "",
      xs: "p-1",
      sm: "p-2",
      md: "p-4",
      lg: "p-6",
      xl: "p-8",
      responsive: "px-4 sm:px-6 md:px-7 lg:px-8 xl:px-9 2xl:px-10",
      "responsive-y": "py-4 sm:py-6 md:py-6 lg:py-8 xl:py-10 2xl:py-10",
      "responsive-full": "px-4 sm:px-6 md:px-7 lg:px-8 xl:px-9 2xl:px-10 py-4 sm:py-6 md:py-6",
      "responsive-lg": "px-4 sm:px-6 md:px-7 lg:px-8 xl:px-9 2xl:px-10 py-4",
      "md-lg": "p-6 md:p-8",
      "sm-md": "p-4 sm:p-6",
    },
    paddingX: { none: "", ...createSpacingVariants("px"), responsive: "px-4 sm:px-6 md:px-7 lg:px-8 xl:px-9 2xl:px-10" },
    paddingY: { none: "", ...createSpacingVariants("py"), responsive: "py-4 sm:py-6 md:py-6 lg:py-8 xl:py-10 2xl:py-10" },
    margin: { none: "", auto: "mx-auto", "y-auto": "my-auto" },
    marginX: { none: "", auto: "mx-auto", ...createSpacingVariants("mx") },
    marginY: { none: "", auto: "my-auto", ...createSpacingVariants("my") },
  },
  defaultVariants: {
    cols: 1,
    gap: 0,
    gapX: "none",
    gapY: "none",
    align: "top",
    justify: "start",
    wrap: true,
    fullWidth: false,
    container: false,
    padding: "none",
    paddingX: "none",
    paddingY: "none",
    margin: "none",
    marginX: "none",
    marginY: "none",
  },
})

export interface GridProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof gridVariants> {}

export const Grid = React.forwardRef<HTMLDivElement, GridProps>(
  ({ className, cols, gap, gapX, gapY, align, justify, wrap, fullWidth, container, padding, paddingX, paddingY, margin, marginX, marginY, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          gridVariants({
            cols,
            gap,
            gapX,
            gapY,
            align,
            justify,
            wrap,
            fullWidth,
            container,
            padding,
            paddingX,
            paddingY,
            margin,
            marginX,
            marginY,
          }),
          className
        )}
        {...props}
      />
    )
  }
)

Grid.displayName = "Grid"
