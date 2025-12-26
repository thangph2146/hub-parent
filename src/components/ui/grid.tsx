import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

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
      0: "gap-0",
      1: "gap-1",
      2: "gap-2",
      3: "gap-3",
      4: "gap-4",
      6: "gap-6",
      8: "gap-8",
      12: "gap-12",
      "6-lg-8": "gap-6 lg:gap-8",
      "2-md-4": "gap-2 md:gap-4",
      "2-lg-6": "gap-2 lg:gap-6",
      "4-lg-6": "gap-4 lg:gap-6",
      "4-lg-8": "gap-4 lg:gap-8",
      "responsive": "gap-2 sm:gap-4 lg:gap-6",
    },
    gapX: {
      none: "",
      0: "gap-x-0",
      0.5: "gap-x-0.5",
      1: "gap-x-1",
      1.5: "gap-x-1.5",
      2: "gap-x-2",
      3: "gap-x-3",
      4: "gap-x-4",
      5: "gap-x-5",
      6: "gap-x-6",
      8: "gap-x-8",
      12: "gap-x-12",
      16: "gap-x-16",
    },
    gapY: {
      none: "",
      0: "gap-y-0",
      0.5: "gap-y-0.5",
      1: "gap-y-1",
      1.5: "gap-y-1.5",
      2: "gap-y-2",
      3: "gap-y-3",
      4: "gap-y-4",
      5: "gap-y-5",
      6: "gap-y-6",
      8: "gap-y-8",
      12: "gap-y-12",
      16: "gap-y-16",
    },
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
      "responsive": "px-4 sm:px-6 lg:px-8",
      "responsive-y": "py-4 sm:py-6 lg:py-8",
      "responsive-full": "px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8",
      "responsive-lg": "px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16",
      "md-lg": "p-6 md:p-8",
      "sm-md": "p-4 sm:p-6",
    },
    paddingX: {
      none: "",
      0: "px-0",
      1: "px-1",
      2: "px-2",
      3: "px-3",
      4: "px-4",
      5: "px-5",
      6: "px-6",
      8: "px-8",
      10: "px-10",
      12: "px-12",
      16: "px-16",
      "responsive": "px-4 sm:px-6 lg:px-8",
    },
    paddingY: {
      none: "",
      0: "py-0",
      1: "py-1",
      2: "py-2",
      3: "py-3",
      4: "py-4",
      5: "py-5",
      6: "py-6",
      8: "py-8",
      10: "py-10",
      12: "py-12",
      16: "py-16",
      "responsive": "py-4 sm:py-6 lg:py-8",
    },
    margin: {
      none: "",
      auto: "mx-auto",
      "y-auto": "my-auto",
    },
    marginX: {
      none: "",
      auto: "mx-auto",
      0: "mx-0",
      1: "mx-1",
      2: "mx-2",
      3: "mx-3",
      4: "mx-4",
      5: "mx-5",
      6: "mx-6",
      8: "mx-8",
      10: "mx-10",
      12: "mx-12",
      16: "mx-16",
    },
    marginY: {
      none: "",
      auto: "my-auto",
      0: "my-0",
      1: "my-1",
      2: "my-2",
      3: "my-3",
      4: "my-4",
      5: "my-5",
      6: "my-6",
      8: "my-8",
      10: "my-10",
      12: "my-12",
      16: "my-16",
    },
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
        className={cn(gridVariants({ cols, gap, gapX, gapY, align, justify, wrap, fullWidth, container, padding, paddingX, paddingY, margin, marginX, marginY }), className)}
        {...props}
      />
    )
  }
)

Grid.displayName = "Grid"

// Row Component (Ant Design compatible)
export interface RowProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Vertical alignment
   * @default "top"
   */
  align?: "top" | "middle" | "bottom" | "stretch" | {
    xs?: "top" | "middle" | "bottom" | "stretch"
    sm?: "top" | "middle" | "bottom" | "stretch"
    md?: "top" | "middle" | "bottom" | "stretch"
    lg?: "top" | "middle" | "bottom" | "stretch"
    xl?: "top" | "middle" | "bottom" | "stretch"
    xxl?: "top" | "middle" | "bottom" | "stretch"
  }
  /**
   * Spacing between grids
   * @default 0
   */
  gutter?: number | string | {
    xs?: number | string
    sm?: number | string
    md?: number | string
    lg?: number | string
    xl?: number | string
    xxl?: number | string
  } | [number | string, number | string]
  /**
   * Horizontal arrangement
   * @default "start"
   */
  justify?: "start" | "end" | "center" | "space-around" | "space-between" | "space-evenly" | {
    xs?: "start" | "end" | "center" | "space-around" | "space-between" | "space-evenly"
    sm?: "start" | "end" | "center" | "space-around" | "space-between" | "space-evenly"
    md?: "start" | "end" | "center" | "space-around" | "space-between" | "space-evenly"
    lg?: "start" | "end" | "center" | "space-around" | "space-between" | "space-evenly"
    xl?: "start" | "end" | "center" | "space-around" | "space-between" | "space-evenly"
    xxl?: "start" | "end" | "center" | "space-around" | "space-between" | "space-evenly"
  }
  /**
   * Auto wrap line
   * @default true
   */
  wrap?: boolean
}

export const Row = React.forwardRef<HTMLDivElement, RowProps>(
  ({ className, align = "top", gutter = 0, justify = "start", wrap = true, style, ...props }, ref) => {
    const classes: string[] = ["flex", "flex-row"]
    
    // Map align values - handle both string and responsive object
    if (typeof align === "string") {
      const alignMap: Record<string, string> = {
        top: "items-start",
        middle: "items-center",
        bottom: "items-end",
        stretch: "items-stretch",
      }
      classes.push(alignMap[align] || "items-start")
    } else if (typeof align === "object") {
      // Responsive align - use default (xs) and add responsive classes
      const defaultAlign = align.xs || "top"
      classes.push(defaultAlign === "top" ? "items-start" : defaultAlign === "middle" ? "items-center" : defaultAlign === "bottom" ? "items-end" : "items-stretch")
      
      // Add responsive classes for other breakpoints
      if (align.sm) classes.push(`sm:items-${align.sm === "top" ? "start" : align.sm === "middle" ? "center" : align.sm === "bottom" ? "end" : "stretch"}`)
      if (align.md) classes.push(`md:items-${align.md === "top" ? "start" : align.md === "middle" ? "center" : align.md === "bottom" ? "end" : "stretch"}`)
      if (align.lg) classes.push(`lg:items-${align.lg === "top" ? "start" : align.lg === "middle" ? "center" : align.lg === "bottom" ? "end" : "stretch"}`)
      if (align.xl) classes.push(`xl:items-${align.xl === "top" ? "start" : align.xl === "middle" ? "center" : align.xl === "bottom" ? "end" : "stretch"}`)
      if (align.xxl) classes.push(`2xl:items-${align.xxl === "top" ? "start" : align.xxl === "middle" ? "center" : align.xxl === "bottom" ? "end" : "stretch"}`)
    }

    // Map justify values - handle both string and responsive object
    if (typeof justify === "string") {
      const justifyMap: Record<string, string> = {
        start: "justify-start",
        end: "justify-end",
        center: "justify-center",
        "space-around": "justify-around",
        "space-between": "justify-between",
        "space-evenly": "justify-evenly",
      }
      classes.push(justifyMap[justify] || "justify-start")
    } else if (typeof justify === "object") {
      // Responsive justify - use default (xs) and add responsive classes
      const defaultJustify = justify.xs || "start"
      const justifyMap: Record<string, string> = {
        start: "justify-start",
        end: "justify-end",
        center: "justify-center",
        "space-around": "justify-around",
        "space-between": "justify-between",
        "space-evenly": "justify-evenly",
      }
      classes.push(justifyMap[defaultJustify] || "justify-start")
      
      // Add responsive classes for other breakpoints
      if (justify.sm) classes.push(`sm:${justifyMap[justify.sm] || "justify-start"}`)
      if (justify.md) classes.push(`md:${justifyMap[justify.md] || "justify-start"}`)
      if (justify.lg) classes.push(`lg:${justifyMap[justify.lg] || "justify-start"}`)
      if (justify.xl) classes.push(`xl:${justifyMap[justify.xl] || "justify-start"}`)
      if (justify.xxl) classes.push(`2xl:${justifyMap[justify.xxl] || "justify-start"}`)
    }

    classes.push(wrap ? "flex-wrap" : "flex-nowrap")

    // Handle gutter with inline styles for better flexibility
    const gutterStyle: React.CSSProperties = { ...style }
    if (gutter !== undefined && gutter !== 0) {
      if (typeof gutter === "number") {
        const gapValue = `${gutter * 0.25}rem` // Convert to rem (assuming 4px base)
        gutterStyle.gap = gapValue
      } else if (typeof gutter === "string") {
        gutterStyle.gap = gutter
      } else if (Array.isArray(gutter)) {
        const [horizontal, vertical] = gutter
        gutterStyle.columnGap = typeof horizontal === "number" ? `${horizontal * 0.25}rem` : horizontal
        gutterStyle.rowGap = typeof vertical === "number" ? `${vertical * 0.25}rem` : vertical
      } else if (typeof gutter === "object") {
        // Responsive gutter - use CSS variables or media queries
        // For simplicity, use the smallest breakpoint as default
        const defaultGutter = gutter.xs || gutter.sm || gutter.md || gutter.lg || gutter.xl || gutter.xxl || 0
        if (typeof defaultGutter === "number") {
          gutterStyle.gap = `${defaultGutter * 0.25}rem`
        } else {
          gutterStyle.gap = defaultGutter
        }
        // Note: Full responsive gutter support would require CSS-in-JS or style tag
      }
    }

    return (
      <div
        ref={ref}
        className={cn(classes, className)}
        style={Object.keys(gutterStyle).length > 0 ? gutterStyle : undefined}
        {...props}
      />
    )
  }
)

Row.displayName = "Row"

// Col Component (Ant Design compatible)
export interface ColProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Flex layout style
   */
  flex?: string | number
  /**
   * The number of cells to offset Col from the left
   * @default 0
   */
  offset?: number
  /**
   * Raster order
   * @default 0
   */
  order?: number
  /**
   * The number of cells that raster is moved to the left
   * @default 0
   */
  pull?: number
  /**
   * The number of cells that raster is moved to the right
   * @default 0
   */
  push?: number
  /**
   * Raster number of cells to occupy, 0 corresponds to display: none
   */
  span?: number
  /**
   * screen < 576px and also default setting
   */
  xs?: number | {
    span?: number
    offset?: number
    order?: number
    pull?: number
    push?: number
  }
  /**
   * screen ≥ 576px
   */
  sm?: number | {
    span?: number
    offset?: number
    order?: number
    pull?: number
    push?: number
  }
  /**
   * screen ≥ 768px
   */
  md?: number | {
    span?: number
    offset?: number
    order?: number
    pull?: number
    push?: number
  }
  /**
   * screen ≥ 992px
   */
  lg?: number | {
    span?: number
    offset?: number
    order?: number
    pull?: number
    push?: number
  }
  /**
   * screen ≥ 1200px
   */
  xl?: number | {
    span?: number
    offset?: number
    order?: number
    pull?: number
    push?: number
  }
  /**
   * screen ≥ 1600px
   */
  xxl?: number | {
    span?: number
    offset?: number
    order?: number
    pull?: number
    push?: number
  }
}

export const Col = React.forwardRef<HTMLDivElement, ColProps>(
  ({ className, flex, offset = 0, order = 0, pull = 0, push = 0, span, xs, sm, md, lg, xl, xxl, style, ...props }, ref) => {
    const classes: string[] = []
    const colStyle: React.CSSProperties = {}
    
    // Handle flex with inline style for better flexibility
    if (flex !== undefined) {
      if (typeof flex === "number") {
        colStyle.flex = `${flex} ${flex} auto`
      } else {
        colStyle.flex = flex
      }
    }

    // Handle span (0 = hidden, undefined = auto/full width)
    if (span !== undefined) {
      if (span === 0) {
        classes.push("hidden")
      } else {
        // Assuming 24-column grid system (Ant Design standard)
        const width = (span / 24) * 100
        colStyle.width = `${width}%`
      }
    }
    // If no span, flex, or responsive props are provided, Col will take natural width
    // This matches Ant Design behavior where span defaults to none (auto width)

    // Handle order
    if (order !== 0) {
      colStyle.order = order
    }

    // Handle offset, pull, and push
    // Priority: push > pull > offset (push/pull override offset)
    if (push > 0) {
      const pushWidth = (push / 24) * 100
      colStyle.marginLeft = `${pushWidth}%`
    } else if (pull > 0) {
      const pullWidth = (pull / 24) * 100
      colStyle.marginLeft = `-${pullWidth}%`
    } else if (offset > 0) {
      const offsetWidth = (offset / 24) * 100
      colStyle.marginLeft = `${offsetWidth}%`
    }

    // Handle responsive breakpoints using CSS custom properties and media queries
    // For Tailwind, we'll use arbitrary values
    const processBreakpoint = (value: number | { span?: number; offset?: number; order?: number; pull?: number; push?: number } | undefined, prefix: string) => {
      if (value === undefined) return
      
      if (typeof value === "number") {
        if (value === 0) {
          classes.push(`${prefix}:hidden`)
        } else {
          const width = (value / 24) * 100
          classes.push(`${prefix}:w-[${width}%]`)
        }
      } else {
        if (value.span !== undefined) {
          if (value.span === 0) {
            classes.push(`${prefix}:hidden`)
          } else {
            const width = (value.span / 24) * 100
            classes.push(`${prefix}:w-[${width}%]`)
          }
        }
        // Handle order
        if (value.order !== undefined) {
          classes.push(`${prefix}:order-${value.order}`)
        }
        // Handle offset, pull, and push with priority: push > pull > offset
        if (value.push) {
          const pushWidth = (value.push / 24) * 100
          classes.push(`${prefix}:ml-[${pushWidth}%]`)
        } else if (value.pull) {
          const pullWidth = (value.pull / 24) * 100
          classes.push(`${prefix}:-ml-[${pullWidth}%]`)
        } else if (value.offset) {
          const offsetWidth = (value.offset / 24) * 100
          classes.push(`${prefix}:ml-[${offsetWidth}%]`)
        }
      }
    }

    // Map breakpoints: xs (default, no prefix), sm (640px), md (768px), lg (1024px), xl (1280px), 2xl (1536px)
    // xs is the default breakpoint (< 576px in Ant Design, but we use Tailwind's default which is < 640px)
    if (xs !== undefined) {
      processBreakpoint(xs, "")
    }
    processBreakpoint(sm, "sm")
    processBreakpoint(md, "md")
    processBreakpoint(lg, "lg")
    processBreakpoint(xl, "xl")
    processBreakpoint(xxl, "2xl")

    return (
      <div
        ref={ref}
        className={cn(classes, className)}
        style={Object.keys(colStyle).length > 0 ? { ...colStyle, ...style } : style}
        {...props}
      />
    )
  }
)

Col.displayName = "Col"

