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
      "r-6-sm-0": "mr-6 sm:mr-0",
    },
    position: {
      relative: "relative",
      absolute: "absolute",
      fixed: "fixed",
      sticky: "sticky",
      static: "static",
      "absolute-bottom-right": "absolute bottom-0 right-0",
      "absolute-left-center": "absolute left-6 top-1/2 transform -translate-y-1/2",
    },
    border: {
      none: "",
      all: "border",
      top: "border-t",
      bottom: "border-b",
      left: "border-l",
      right: "border-r",
      x: "border-x",
      y: "border-y",
    },
    height: {
      auto: "",
      full: "h-full",
      screen: "h-screen",
      "16": "h-16",
      "64": "h-64",
      "12": "h-12",
      "2": "h-2",
      "min-full": "min-h-full",
    },
    shrink: {
      true: "shrink-0",
      false: "",
    },
    overflow: {
      none: "",
      hidden: "overflow-hidden",
      auto: "overflow-auto",
      scroll: "overflow-scroll",
    },
    minWidth: {
      none: "",
      "0": "min-w-0",
      full: "min-w-full",
      "120": "min-w-[120px]",
      "140": "min-w-[140px]",
    },
    maxWidth: {
      none: "",
      full: "max-w-full",
      screen: "max-w-screen",
      "100vw": "max-w-[100dvw]",
      "75": "max-w-[75%]",
      "70": "max-w-[70%]",
      "32": "max-w-[32px]",
    },
    rounded: {
      none: "",
      sm: "rounded-sm",
      md: "rounded-md",
      lg: "rounded-lg",
      xl: "rounded-xl",
      full: "rounded-full",
    },
    bg: {
      none: "",
      primary: "bg-primary text-primary-foreground",
      muted: "bg-muted text-foreground",
      "muted-50": "bg-muted/50",
      "white-10": "bg-white/10",
      white: "bg-white",
      background: "bg-background",
      destructive: "bg-destructive/10",
      "accent-10": "bg-accent/10",
      "green-500": "bg-green-500",
    },
    hover: {
      none: "",
      default: "hover:bg-primary/10",
      destructive: "hover:bg-destructive/10",
    },
    opacity: {
      none: "",
      "60": "opacity-60",
      "80": "opacity-80",
    },
    width: {
      none: "",
      full: "w-full",
      "2": "w-2",
      "100": "min-w-[100px]",
    },
    cursor: {
      none: "",
      pointer: "cursor-pointer",
    },
    textAlign: {
      none: "",
      center: "text-center",
      left: "text-left",
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
    border: "none",
    height: "auto",
    shrink: false,
    overflow: "none",
    minWidth: "none",
    maxWidth: "none",
    rounded: "none",
    bg: "none",
    hover: "none",
    opacity: "none",
    width: "none",
    cursor: "none",
    textAlign: "none",
  },
})

export interface FlexProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof flexVariants> {
  as?: React.ElementType
}

export const Flex = React.forwardRef<HTMLDivElement, FlexProps>(
  ({ className, direction, align, justify, gap, wrap, fullWidth, container, padding, margin, position, border, height, shrink, overflow, minWidth, maxWidth, rounded, bg, hover, opacity, width, cursor, textAlign, as: Component = "div", ...props }, ref) => {
    return (
      <Component
        ref={ref}
        className={cn(flexVariants({ direction, align, justify, gap, wrap, fullWidth, container, padding, margin, position, border, height, shrink, overflow, minWidth, maxWidth, rounded, bg, hover, opacity, width, cursor, textAlign }), className)}
        {...props}
      />
    )
  }
)

Flex.displayName = "Flex"

