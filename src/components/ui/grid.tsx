import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

// Shared utilities
const numberToRem = (value: number): string => `${value * 0.25}rem`
const spanToWidth = (span: number): string => `${(span / 24) * 100}%`

// Generate gap variants
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

// Generate spacing variants
const createSpacingVariants = (prefix: "px" | "py" | "mx" | "my") => {
  const base: Record<string, string> = { none: "" }
  const values = [0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16]
  values.forEach(v => base[v] = `${prefix}-${v}`)
  return base
}

// Helper: Map align/justify values
const mapAlign = (align: string): string => {
  const map: Record<string, string> = {
    top: "items-start", middle: "items-center", bottom: "items-end", stretch: "items-stretch",
    start: "items-start", center: "items-center", end: "items-end",
  }
  return map[align] || "items-start"
}

const mapJustify = (justify: string): string => {
  const map: Record<string, string> = {
    start: "justify-start", end: "justify-end", center: "justify-center",
    "space-around": "justify-around", "space-between": "justify-between", "space-evenly": "justify-evenly",
  }
  return map[justify] || "justify-start"
}

// Helper: Process gutter prop
const processGutter = (
  gutter: number | string | { xs?: number | string; sm?: number | string; md?: number | string; lg?: number | string; xl?: number | string; xxl?: number | string } | [number | string, number | string] | undefined,
  style: React.CSSProperties
): React.CSSProperties => {
  if (gutter === undefined || gutter === 0) return style
  const gutterStyle = { ...style }
  if (typeof gutter === "number") {
    gutterStyle.gap = numberToRem(gutter)
  } else if (typeof gutter === "string") {
    gutterStyle.gap = gutter
  } else if (Array.isArray(gutter)) {
    const [horizontal, vertical] = gutter
    gutterStyle.columnGap = typeof horizontal === "number" ? numberToRem(horizontal) : horizontal
    gutterStyle.rowGap = typeof vertical === "number" ? numberToRem(vertical) : vertical
  } else if (typeof gutter === "object") {
    const defaultGutter = gutter.xs || gutter.sm || gutter.md || gutter.lg || gutter.xl || gutter.xxl || 0
    gutterStyle.gap = typeof defaultGutter === "number" ? numberToRem(defaultGutter) : defaultGutter
  }
  return gutterStyle
}

// Helper: Process responsive align/justify
const processResponsiveAlign = (
  align: string | { xs?: string; sm?: string; md?: string; lg?: string; xl?: string; xxl?: string } | undefined,
  defaultValue: string
): string[] => {
  const classes: string[] = []
  if (typeof align === "string") {
    classes.push(mapAlign(align))
  } else if (typeof align === "object" && align !== null) {
    const defaultAlign = align.xs || defaultValue
    classes.push(mapAlign(defaultAlign))
    const breakpoints = [
      { key: "sm", value: align.sm },
      { key: "md", value: align.md },
      { key: "lg", value: align.lg },
      { key: "xl", value: align.xl },
      { key: "xxl", value: align.xxl },
    ]
    breakpoints.forEach(({ key, value }) => {
      if (value) {
        const prefix = key === "xxl" ? "2xl" : key
        classes.push(`${prefix}:${mapAlign(value)}`)
      }
    })
  }
  return classes
}

const processResponsiveJustify = (
  justify: string | { xs?: string; sm?: string; md?: string; lg?: string; xl?: string; xxl?: string } | undefined,
  defaultValue: string
): string[] => {
  const classes: string[] = []
  if (typeof justify === "string") {
    classes.push(mapJustify(justify))
  } else if (typeof justify === "object" && justify !== null) {
    const defaultJustify = justify.xs || defaultValue
    classes.push(mapJustify(defaultJustify))
    const breakpoints = [
      { key: "sm", value: justify.sm },
      { key: "md", value: justify.md },
      { key: "lg", value: justify.lg },
      { key: "xl", value: justify.xl },
      { key: "xxl", value: justify.xxl },
    ]
    breakpoints.forEach(({ key, value }) => {
      if (value) {
        const prefix = key === "xxl" ? "2xl" : key
        classes.push(`${prefix}:${mapJustify(value)}`)
      }
    })
  }
  return classes
}

// Helper: Process breakpoint value for Col
const processBreakpoint = (
  value: number | { span?: number; offset?: number; order?: number; pull?: number; push?: number } | undefined,
  prefix: string
): string[] => {
  const classes: string[] = []
  if (value === undefined) return classes
  if (typeof value === "number") {
    if (value === 0) {
      classes.push(prefix ? `${prefix}:hidden` : "hidden")
    } else {
      const width = spanToWidth(value)
      classes.push(prefix ? `${prefix}:w-[${width}]` : `w-[${width}]`)
    }
  } else {
    if (value.span !== undefined) {
      if (value.span === 0) {
        classes.push(prefix ? `${prefix}:hidden` : "hidden")
      } else {
        const width = spanToWidth(value.span)
        classes.push(prefix ? `${prefix}:w-[${width}]` : `w-[${width}]`)
      }
    }
    if (value.order !== undefined) {
      classes.push(prefix ? `${prefix}:order-${value.order}` : `order-${value.order}`)
    }
    // Priority: push > pull > offset
    if (value.push) {
      const pushWidth = spanToWidth(value.push)
      classes.push(prefix ? `${prefix}:ml-[${pushWidth}]` : `ml-[${pushWidth}]`)
    } else if (value.pull) {
      const pullWidth = spanToWidth(value.pull)
      classes.push(prefix ? `${prefix}:-ml-[${pullWidth}]` : `-ml-[${pullWidth}]`)
    } else if (value.offset) {
      const offsetWidth = spanToWidth(value.offset)
      classes.push(prefix ? `${prefix}:ml-[${offsetWidth}]` : `ml-[${offsetWidth}]`)
    }
  }
  return classes
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

// Row Component (Ant Design compatible)
export interface RowProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: "top" | "middle" | "bottom" | "stretch" | {
    xs?: "top" | "middle" | "bottom" | "stretch"
    sm?: "top" | "middle" | "bottom" | "stretch"
    md?: "top" | "middle" | "bottom" | "stretch"
    lg?: "top" | "middle" | "bottom" | "stretch"
    xl?: "top" | "middle" | "bottom" | "stretch"
    xxl?: "top" | "middle" | "bottom" | "stretch"
  }
  gutter?: number | string | {
    xs?: number | string
    sm?: number | string
    md?: number | string
    lg?: number | string
    xl?: number | string
    xxl?: number | string
  } | [number | string, number | string]
  justify?: "start" | "end" | "center" | "space-around" | "space-between" | "space-evenly" | {
    xs?: "start" | "end" | "center" | "space-around" | "space-between" | "space-evenly"
    sm?: "start" | "end" | "center" | "space-around" | "space-between" | "space-evenly"
    md?: "start" | "end" | "center" | "space-around" | "space-between" | "space-evenly"
    lg?: "start" | "end" | "center" | "space-around" | "space-between" | "space-evenly"
    xl?: "start" | "end" | "center" | "space-around" | "space-between" | "space-evenly"
    xxl?: "start" | "end" | "center" | "space-around" | "space-between" | "space-evenly"
  }
  wrap?: boolean
}

export const Row = React.forwardRef<HTMLDivElement, RowProps>(
  ({ className, align = "top", gutter = 0, justify = "start", wrap = true, style, ...props }, ref) => {
    const alignClasses = React.useMemo(() => processResponsiveAlign(align, "top"), [align])
    const justifyClasses = React.useMemo(() => processResponsiveJustify(justify, "start"), [justify])
    const gutterStyle = React.useMemo(() => processGutter(gutter, style || {}), [gutter, style])
    const classes = React.useMemo(
      () => ["flex", "flex-row", ...alignClasses, ...justifyClasses, wrap ? "flex-wrap" : "flex-nowrap"],
      [alignClasses, justifyClasses, wrap]
    )
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
export interface ColProps extends React.HTMLAttributes<HTMLDivElement> {
  flex?: string | number
  offset?: number
  order?: number
  pull?: number
  push?: number
  span?: number
  xs?: number | { span?: number; offset?: number; order?: number; pull?: number; push?: number }
  sm?: number | { span?: number; offset?: number; order?: number; pull?: number; push?: number }
  md?: number | { span?: number; offset?: number; order?: number; pull?: number; push?: number }
  lg?: number | { span?: number; offset?: number; order?: number; pull?: number; push?: number }
  xl?: number | { span?: number; offset?: number; order?: number; pull?: number; push?: number }
  xxl?: number | { span?: number; offset?: number; order?: number; pull?: number; push?: number }
}

export const Col = React.forwardRef<HTMLDivElement, ColProps>(
  ({ className, flex, offset = 0, order = 0, pull = 0, push = 0, span, xs, sm, md, lg, xl, xxl, style, ...props }, ref) => {
    const flexStyle = React.useMemo(() => {
      const styles: React.CSSProperties = {}
      if (flex !== undefined) {
        styles.flex = typeof flex === "number" ? `${flex} ${flex} auto` : flex
      }
      return styles
    }, [flex])

    const spanStyle = React.useMemo(() => {
      const styles: React.CSSProperties = {}
      if (span !== undefined && span !== 0) {
        styles.width = spanToWidth(span)
      }
      return styles
    }, [span])

    const orderStyle = React.useMemo(() => {
      const styles: React.CSSProperties = {}
      if (order !== 0) styles.order = order
      return styles
    }, [order])

    const offsetStyle = React.useMemo(() => {
      const styles: React.CSSProperties = {}
      if (push > 0) {
        styles.marginLeft = spanToWidth(push)
      } else if (pull > 0) {
        styles.marginLeft = `-${spanToWidth(pull)}`
      } else if (offset > 0) {
        styles.marginLeft = spanToWidth(offset)
      }
      return styles
    }, [push, pull, offset])

    const responsiveClasses = React.useMemo(() => {
      const classes: string[] = []
      if (span === 0) classes.push("hidden")
      if (xs !== undefined) classes.push(...processBreakpoint(xs, ""))
      classes.push(...processBreakpoint(sm, "sm"))
      classes.push(...processBreakpoint(md, "md"))
      classes.push(...processBreakpoint(lg, "lg"))
      classes.push(...processBreakpoint(xl, "xl"))
      classes.push(...processBreakpoint(xxl, "2xl"))
      return classes
    }, [span, xs, sm, md, lg, xl, xxl])

    const mergedStyle = React.useMemo(() => {
      const styles = { ...flexStyle, ...spanStyle, ...orderStyle, ...offsetStyle, ...style }
      return Object.keys(styles).length > 0 ? styles : undefined
    }, [flexStyle, spanStyle, orderStyle, offsetStyle, style])

    return (
      <div
        ref={ref}
        className={cn(responsiveClasses, className)}
        style={mergedStyle}
        {...props}
      />
    )
  }
)

Col.displayName = "Col"
