import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/utils"

// Shared utilities
const numberToRem = (value: number): string => `${value * 0.25}rem`
const isStandardFlex = (value: string): boolean => 
  ["normal", "none", "1", "auto", "initial"].includes(value)

// Shared valid values constants
const VALID_SPACING_VALUES = [0, 0.5, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16] as const
const VALID_GAP_VALUES = [0, 0.5, 1, 1.5, 2, 3, 4, 5, 6, 8, 12, 16] as const
const VALID_SPACING_STRING_VALUES = ["0", "0.5", "1", "2", "3", "4", "5", "6", "8", "10", "12", "16"] as const

// Generate spacing variants (padding/margin)
const createSpacingVariants = (prefix: "p" | "px" | "py" | "pt" | "pb" | "mx" | "my" | "mt" | "mb" | "ml" | "mr") => {
  const base: Record<string, string> = { none: "" }
  VALID_SPACING_VALUES.forEach(v => base[v] = `${prefix}-${v}`)
  return base
}

// Generate gap variants for gapX/gapY
const createGapVariants = (prefix: string) => {
  const variants: Record<string, string> = {}
  VALID_GAP_VALUES.forEach(v => variants[String(v)] = `${prefix}-${v}`)
  return variants
}

const flexVariants = cva("flex", {
  variants: {
    direction: {
      row: "flex-row",
      col: "flex-col",
      "col-lg-row": "flex-col lg:flex-row",
      "col-md-row": "flex-col md:flex-row",
      "col-sm-row": "flex-col sm:flex-row",
      "row-lg-col": "flex-row lg:flex-col",
      "row-md-col": "flex-row md:flex-col",
      "row-sm-col": "flex-row sm:flex-col",
      "col-lg-row-items-center": "flex-col lg:flex-row lg:items-center",
      "row-lg-col-items-center": "flex-row lg:flex-col lg:items-center",
    },
    align: {
      start: "items-start",
      center: "items-center",
      end: "items-end",
      stretch: "items-stretch",
      baseline: "items-baseline",
      normal: "items-normal",
    },
    justify: {
      start: "justify-start",
      center: "justify-center",
      end: "justify-end",
      between: "justify-between",
      around: "justify-around",
      evenly: "justify-evenly",
      normal: "justify-normal",
      "start-lg-end": "justify-start lg:justify-end",
      "start-sm-end": "justify-start sm:justify-end",
    },
    gap: {
      "0": "gap-0",
      "0.5": "gap-0.5",
      "1": "gap-1",
      "1.5": "gap-1.5",
      "2": "gap-2",
      "3": "gap-3",
      "4": "gap-4",
      "5": "gap-5",
      "6": "gap-6",
      "8": "gap-8",
      "12": "gap-12",
      "16": "gap-16",
      small: "gap-2",
      middle: "gap-4",
      large: "gap-8",
      "6-lg-8": "gap-6 lg:gap-8",
      "2-md-4": "gap-2 md:gap-4",
      "2-lg-6": "gap-2 lg:gap-6",
      "4-lg-6": "gap-4 lg:gap-6",
      "4-lg-8": "gap-4 lg:gap-8",
      responsive: "gap-2 sm:gap-4 md:gap-5 lg:gap-6",
    },
    gapX: { none: "", ...createGapVariants("gap-x") },
    gapY: { none: "", ...createGapVariants("gap-y") },
    wrap: {
      true: "flex-wrap",
      false: "flex-nowrap",
      wrap: "flex-wrap",
      nowrap: "flex-nowrap",
      "wrap-reverse": "flex-wrap-reverse",
    },
    fullWidth: { true: "w-full", false: "" },
    container: { true: "container mx-auto", false: "" },
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
      "py-2.5": "py-2.5",
      "pt-0": "pt-0",
      "pb-3": "pb-3",
      "pb-4": "pb-4",
      "pb-6": "pb-6",
      "pt-6": "pt-6",
      "mt-0.5": "mt-0.5",
      responsive: "px-4 sm:px-6 md:px-7 lg:px-8 xl:px-9 2xl:px-10",
      "responsive-y": "py-4 sm:py-6 md:py-6 lg:py-8 xl:py-10 2xl:py-10",
      "responsive-full": "px-4 sm:px-6 md:px-7 lg:px-8 xl:px-9 2xl:px-10 py-4 sm:py-6 md:py-6 lg:py-8 xl:py-10 2xl:py-10",
      "responsive-lg": "px-4 sm:px-6 md:px-7 lg:px-8 xl:px-9 2xl:px-10 py-8",
      "md-lg": "p-6 md:p-8",
      "sm-md": "p-4 sm:p-6",
    },
    paddingX: { none: "", ...createSpacingVariants("px"), responsive: "px-4 sm:px-6 md:px-7 lg:px-8 xl:px-9 2xl:px-10" },
    paddingY: { none: "", ...createSpacingVariants("py"), responsive: "py-4 sm:py-6 md:py-6 lg:py-8 xl:py-10 2xl:py-10" },
    paddingTop: { none: "", ...createSpacingVariants("pt") },
    paddingBottom: { none: "", ...createSpacingVariants("pb") },
    margin: {
      none: "",
      auto: "mx-auto",
      "y-auto": "my-auto",
      "r-6-sm-0": "mr-6 sm:mr-0",
      "t-auto": "mt-auto",
      "b-4": "mb-4",
    },
    marginX: { none: "", auto: "mx-auto", ...createSpacingVariants("mx") },
    marginY: { none: "", auto: "my-auto", ...createSpacingVariants("my") },
    marginTop: { none: "", auto: "mt-auto", ...createSpacingVariants("mt") },
    marginBottom: { none: "", ...createSpacingVariants("mb") },
    marginLeft: { none: "", ...createSpacingVariants("ml") },
    marginRight: { none: "", ...createSpacingVariants("mr") },
    position: {
      relative: "relative",
      absolute: "absolute",
      fixed: "fixed",
      sticky: "sticky",
      static: "static",
      "absolute-bottom-right": "absolute bottom-0 right-0",
      "absolute-left-center": "absolute left-6 top-1/2 transform -translate-y-1/2",
      "absolute-right-top": "absolute right-0 top-0",
      "absolute-inset": "absolute inset-0",
      "absolute-top-right": "absolute top-2 right-2",
    },
    objectFit: { none: "", cover: "object-cover", contain: "object-contain", fill: "object-fill" },
    imageStyle: {
      none: "",
      "cover-dark": "object-cover dark:brightness-[0.2] dark:grayscale",
      "contain-dark": "object-contain dark:brightness-[0.2] dark:grayscale",
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
      "b-border": "border-b border-border",
      "b-border-50": "border-b border-border/50",
    },
    height: {
      auto: "",
      full: "h-full",
      screen: "h-screen",
      "2": "h-2",
      "4": "h-4",
      "6": "h-6",
      "8": "h-8",
      "10": "h-10",
      "12": "h-12",
      "14": "h-14",
      "16": "h-16",
      "24": "h-24",
      "28": "h-28",
      "32": "h-32",
      "64": "h-64",
      "min-full": "min-h-full",
      hero: "min-h-[300px] sm:min-h-[350px] lg:min-h-[400px] xxl:min-h-[500px]",
    },
    maxHeight: {
      none: "",
      full: "max-h-full",
      screen: "max-h-screen",
      "400": "max-h-[400px]",
      "500": "max-h-[500px]",
      "600": "max-h-[600px]",
      "48": "max-h-48",
    },
    shrink: { true: "shrink-0", false: "", "1": "shrink" },
    overflow: { none: "", hidden: "overflow-hidden", auto: "overflow-auto", scroll: "overflow-scroll" },
    minWidth: { none: "", "0": "min-w-0", full: "min-w-full", "120": "min-w-[120px]", "140": "min-w-[140px]" },
    maxWidth: {
      none: "",
      full: "max-w-full",
      screen: "max-w-screen",
      "100vw": "max-w-[100dvw]",
      "75": "max-w-[75%]",
      "70": "max-w-[70%]",
      "32": "max-w-[32px]",
    },
    rounded: { none: "", sm: "rounded-sm", md: "rounded-md", lg: "rounded-lg", xl: "rounded-xl", full: "rounded-full", "[inherit]": "rounded-[inherit]" },
    bg: {
      none: "",
      primary: "bg-primary text-primary-foreground",
      muted: "bg-muted text-foreground",
      "muted-50": "bg-muted/50",
      "white-10": "bg-white/10",
      white: "bg-white",
      background: "bg-background",
      card: "bg-card",
      destructive: "bg-destructive/10",
      "accent-10": "bg-accent/10",
      "green-500": "bg-green-500",
      "green-500-border": "bg-green-500 border-2 border-background",
      "destructive-text": "bg-destructive/10 text-destructive",
      "background-80": "bg-background/80",
      "primary-20": "bg-primary/20",
      "primary-10": "bg-primary/10",
      "primary-10-dark-20": "bg-primary/10 dark:bg-primary/20",
      "secondary-10": "bg-secondary/10",
      "secondary-10-dark-15": "bg-secondary/10 dark:bg-secondary/15",
      "green-100": "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
      "gray-100": "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
    },
    hover: { none: "", default: "hover:bg-primary/10", destructive: "hover:bg-destructive/10", "accent-10": "hover:bg-accent/10" },
    opacity: { none: "", "60": "opacity-60", "80": "opacity-80" },
    width: {
      none: "",
      full: "w-full",
      "2": "w-2",
      "4": "w-4",
      "6": "w-6",
      "8": "w-8",
      "10": "w-10",
      "12": "w-12",
      "16": "w-16",
      "100": "min-w-[100px]",
      "1/3": "w-full lg:w-1/3",
      "2/3": "w-full lg:w-2/3",
      "400": "w-[400px] max-w-full",
    },
    cursor: { none: "", pointer: "cursor-pointer" },
    textAlign: { none: "", center: "text-center", left: "text-left" },
    flex: { none: "", "1": "flex-1", auto: "flex-auto", initial: "flex-initial", normal: "" },
    grow: { true: "grow", false: "" },
    truncate: { true: "truncate", false: "" },
    lineClamp: { none: "", "1": "line-clamp-1", "2": "line-clamp-2", "3": "line-clamp-3" },
    display: { none: "", "hidden-md-flex": "hidden md:flex" },
    blur: { none: "", xl: "blur-xl", "2xl": "blur-2xl", "3xl": "blur-3xl" },
    animate: { none: "", pulse: "animate-pulse" },
  },
  defaultVariants: {
    direction: "row",
    align: "normal",
    justify: "normal",
    gap: "0",
    gapX: "none",
    gapY: "none",
    wrap: false,
    fullWidth: false,
    container: false,
    padding: "none",
    paddingX: "none",
    paddingY: "none",
    paddingTop: "none",
    paddingBottom: "none",
    margin: "none",
    marginX: "none",
    marginY: "none",
    marginTop: "none",
    marginBottom: "none",
    marginLeft: "none",
    marginRight: "none",
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
    flex: "normal",
    grow: false,
    truncate: false,
    lineClamp: "none",
    display: "none",
    objectFit: "none",
    imageStyle: "none",
    blur: "none",
    animate: "none",
    maxHeight: "none",
  },
})

// Helper functions
const computeDirection = (
  direction?: VariantProps<typeof flexVariants>["direction"],
  vertical?: boolean,
  orientation?: "horizontal" | "vertical"
): VariantProps<typeof flexVariants>["direction"] => {
  if (direction) return direction
  return (vertical || orientation === "vertical") ? "col" : "row"
}

const processGap = (
  gap: VariantProps<typeof flexVariants>["gap"] | string | number | undefined,
  validGapVariants: (string | number)[]
): { gapVariant?: VariantProps<typeof flexVariants>["gap"]; gapStyle?: string } => {
  if (!gap) return {}
  if (validGapVariants.includes(gap as string | number)) {
    return { gapVariant: (typeof gap === "number" ? String(gap) : gap) as VariantProps<typeof flexVariants>["gap"] }
  }
  return typeof gap === "number" ? { gapStyle: numberToRem(gap) } : typeof gap === "string" ? { gapStyle: gap } : {}
}

const processFlex = (
  flexProp: string | undefined,
  style: React.CSSProperties
): { flexVariant: VariantProps<typeof flexVariants>["flex"]; flexStyle: React.CSSProperties } => {
  const flexStyle = { ...style }
  const isStandard = flexProp ? isStandardFlex(flexProp) : true
  const flexVariant: VariantProps<typeof flexVariants>["flex"] = isStandard 
    ? (flexProp as VariantProps<typeof flexVariants>["flex"] || "normal") 
    : "normal"
  if (flexProp && !isStandard) flexStyle.flex = flexProp
  return { flexVariant, flexStyle }
}

const processWrap = (
  wrap: boolean | VariantProps<typeof flexVariants>["wrap"] | undefined
): VariantProps<typeof flexVariants>["wrap"] => {
  if (wrap === true) return "wrap"
  if (wrap === false) return "nowrap"
  if (typeof wrap === "string") return wrap
  return "nowrap"
}

const processSpacing = <T extends VariantProps<typeof flexVariants>["paddingX"] | VariantProps<typeof flexVariants>["marginLeft"] | VariantProps<typeof flexVariants>["marginX"]>(
  spacing: T | number | string | undefined
): T | undefined => {
  if (!spacing) return undefined
  if (typeof spacing === "number" && VALID_SPACING_VALUES.includes(spacing as typeof VALID_SPACING_VALUES[number])) {
    return String(spacing) as T
  }
  if (typeof spacing === "string" && VALID_SPACING_STRING_VALUES.includes(spacing as typeof VALID_SPACING_STRING_VALUES[number])) {
    return spacing as T
  }
  return spacing as T
}

export interface FlexProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "style">,
    Omit<VariantProps<typeof flexVariants>, "flex" | "gap" | "wrap" | "paddingX" | "paddingY" | "paddingTop" | "paddingBottom" | "marginX" | "marginY" | "marginTop" | "marginBottom" | "marginLeft" | "marginRight"> {
  component?: React.ComponentType<React.HTMLAttributes<HTMLElement>>
  vertical?: boolean
  orientation?: "horizontal" | "vertical"
  flex?: "none" | "1" | "auto" | "initial" | "normal" | string
  gap?: VariantProps<typeof flexVariants>["gap"] | string | number
  wrap?: VariantProps<typeof flexVariants>["wrap"] | boolean
  paddingX?: VariantProps<typeof flexVariants>["paddingX"] | number | "0" | "0.5" | "1" | "2" | "3" | "4" | "5" | "6" | "8" | "10" | "12" | "16"
  paddingY?: VariantProps<typeof flexVariants>["paddingY"] | number | "0" | "0.5" | "1" | "2" | "3" | "4" | "5" | "6" | "8" | "10" | "12" | "16"
  paddingTop?: VariantProps<typeof flexVariants>["paddingTop"] | number
  paddingBottom?: VariantProps<typeof flexVariants>["paddingBottom"] | number
  marginX?: VariantProps<typeof flexVariants>["marginX"] | number
  marginY?: VariantProps<typeof flexVariants>["marginY"] | number
  marginTop?: VariantProps<typeof flexVariants>["marginTop"] | number
  marginBottom?: VariantProps<typeof flexVariants>["marginBottom"] | number
  marginLeft?: VariantProps<typeof flexVariants>["marginLeft"] | number
  marginRight?: VariantProps<typeof flexVariants>["marginRight"] | number
  as?: React.ElementType
  style?: React.CSSProperties
}

export const Flex = React.forwardRef<HTMLDivElement, FlexProps>(
  (
    {
      className,
      direction,
      align,
      justify,
      gap,
      gapX,
      gapY,
      wrap = false,
      fullWidth,
      container,
      padding,
      paddingX,
      paddingY,
      paddingTop,
      paddingBottom,
      margin,
      marginX,
      marginY,
      marginTop,
      marginBottom,
      marginLeft,
      marginRight,
      position,
      border,
      height,
      maxHeight,
      shrink,
      overflow,
      minWidth,
      maxWidth,
      rounded,
      bg,
      hover,
      opacity,
      width,
      cursor,
      textAlign,
      flex: flexProp = "normal",
      grow,
      truncate,
      lineClamp,
      display,
      objectFit,
      imageStyle,
      blur,
      animate,
      component,
      vertical = false,
      orientation = "horizontal",
      as: Component = component || "div",
      style,
      ...props
    },
    ref
  ) => {
    const validGapVariants = React.useMemo(() => [
      ...VALID_GAP_VALUES,
      "small", "middle", "large",
      "6-lg-8", "2-md-4", "2-lg-6", "4-lg-6", "4-lg-8", "responsive"
    ], [])

    const computedDirection = React.useMemo(
      () => computeDirection(direction, vertical, orientation),
      [direction, vertical, orientation]
    )

    const { gapVariant, gapStyle } = React.useMemo(
      () => processGap(gap, validGapVariants),
      [gap, validGapVariants]
    )

    const { flexVariant, flexStyle: processedFlexStyle } = React.useMemo(
      () => processFlex(flexProp, style || {}),
      [flexProp, style]
    )

    const wrapVariant = React.useMemo(() => processWrap(wrap), [wrap])

    // Process all spacing props
    const spacingVariants = React.useMemo(() => ({
      paddingX: processSpacing(paddingX),
      paddingY: processSpacing(paddingY),
      paddingTop: processSpacing(paddingTop),
      paddingBottom: processSpacing(paddingBottom),
      marginX: processSpacing(marginX),
      marginY: processSpacing(marginY),
      marginTop: processSpacing(marginTop),
      marginBottom: processSpacing(marginBottom),
      marginLeft: processSpacing(marginLeft),
      marginRight: processSpacing(marginRight),
    }), [paddingX, paddingY, paddingTop, paddingBottom, marginX, marginY, marginTop, marginBottom, marginLeft, marginRight])

    const mergedStyle = React.useMemo(() => {
      const styles: React.CSSProperties = { ...processedFlexStyle }
      if (gapStyle) styles.gap = gapStyle
      return Object.keys(styles).length > 0 ? styles : undefined
    }, [processedFlexStyle, gapStyle])

    return (
      <Component
        ref={ref}
        className={cn(
          flexVariants({
            direction: computedDirection,
            align,
            justify,
            gap: gapVariant,
            gapX,
            gapY,
            wrap: wrapVariant,
            fullWidth,
            container,
            padding,
            paddingX: spacingVariants.paddingX,
            paddingY: spacingVariants.paddingY,
            paddingTop: spacingVariants.paddingTop,
            paddingBottom: spacingVariants.paddingBottom,
            margin,
            marginX: spacingVariants.marginX,
            marginY: spacingVariants.marginY,
            marginTop: spacingVariants.marginTop,
            marginBottom: spacingVariants.marginBottom,
            marginLeft: spacingVariants.marginLeft,
            marginRight: spacingVariants.marginRight,
            position,
            border,
            height,
            maxHeight,
            shrink,
            overflow,
            minWidth,
            maxWidth,
            rounded,
            bg,
            hover,
            opacity,
            width,
            cursor,
            textAlign,
            flex: flexVariant,
            grow,
            truncate,
            lineClamp,
            display,
            objectFit,
            imageStyle,
            blur,
            animate,
          }),
          className
        )}
        style={mergedStyle}
        {...props}
      />
    )
  }
)

Flex.displayName = "Flex"

