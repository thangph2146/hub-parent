import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

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
      small: "gap-2",
      middle: "gap-4",
      large: "gap-8",
      "6-lg-8": "gap-6 lg:gap-8",
      "2-md-4": "gap-2 md:gap-4",
      "2-lg-6": "gap-2 lg:gap-6",
      "4-lg-6": "gap-4 lg:gap-6",
      "4-lg-8": "gap-4 lg:gap-8",
      "responsive": "gap-2 sm:gap-4 md:gap-5 lg:gap-6 xl:gap-8 2xl:gap-8",
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
    wrap: {
      true: "flex-wrap",
      false: "flex-nowrap",
      wrap: "flex-wrap",
      nowrap: "flex-nowrap",
      "wrap-reverse": "flex-wrap-reverse",
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
      "py-2.5": "py-2.5",
      "pt-0": "pt-0",
      "pb-3": "pb-3",
      "pb-4": "pb-4",
      "pb-6": "pb-6",
      "pt-6": "pt-6",
      "mt-0.5": "mt-0.5",
      "responsive": "px-4 sm:px-6 md:px-7 lg:px-8 xl:px-9 2xl:px-10",
      "responsive-y": "py-4 sm:py-6 md:py-6 lg:py-8 xl:py-10 2xl:py-10",
      "responsive-full": "px-4 sm:px-6 md:px-7 lg:px-8 xl:px-9 2xl:px-10 py-4 sm:py-6 md:py-6 lg:py-8 xl:py-10 2xl:py-10",
      "responsive-lg": "px-4 sm:px-6 md:px-7 lg:px-8 xl:px-9 2xl:px-10 py-8 sm:py-12 md:py-14 lg:py-16 xl:py-20 2xl:py-20",
      "md-lg": "p-6 md:p-8",
      "sm-md": "p-4 sm:p-6",
    },
    margin: {
      none: "",
      auto: "mx-auto",
      "y-auto": "my-auto",
      "r-6-sm-0": "mr-6 sm:mr-0",
      "t-auto": "mt-auto",
      "b-4": "mb-4",
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
    marginTop: {
      none: "",
      auto: "mt-auto",
      0: "mt-0",
      0.5: "mt-0.5",
      1: "mt-1",
      2: "mt-2",
      3: "mt-3",
      4: "mt-4",
      5: "mt-5",
      6: "mt-6",
      8: "mt-8",
      10: "mt-10",
      12: "mt-12",
      16: "mt-16",
    },
    marginBottom: {
      none: "",
      0: "mb-0",
      0.5: "mb-0.5",
      1: "mb-1",
      2: "mb-2",
      3: "mb-3",
      4: "mb-4",
      5: "mb-5",
      6: "mb-6",
      8: "mb-8",
      10: "mb-10",
      12: "mb-12",
      16: "mb-16",
    },
    marginLeft: {
      none: "",
      0: "ml-0",
      0.5: "ml-0.5",
      1: "ml-1",
      2: "ml-2",
      3: "ml-3",
      4: "ml-4",
      5: "ml-5",
      6: "ml-6",
      8: "ml-8",
      10: "ml-10",
      12: "ml-12",
      16: "ml-16",
    },
    marginRight: {
      none: "",
      0: "mr-0",
      0.5: "mr-0.5",
      1: "mr-1",
      2: "mr-2",
      3: "mr-3",
      4: "mr-4",
      5: "mr-5",
      6: "mr-6",
      8: "mr-8",
      10: "mr-10",
      12: "mr-12",
      16: "mr-16",
    },
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
    objectFit: {
      none: "",
      cover: "object-cover",
      contain: "object-contain",
      fill: "object-fill",
    },
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
      "hero": "min-h-[300px] sm:min-h-[350px] lg:min-h-[400px] xxl:min-h-[500px]",
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
    shrink: {
      true: "shrink-0",
      false: "",
      "1": "shrink",
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
      "[inherit]": "rounded-[inherit]",
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
      "responsive": "px-4 sm:px-6 md:px-7 lg:px-8 xl:px-9 2xl:px-10",
    },
    paddingY: {
      none: "",
      0: "py-0",
      1: "py-1",
      2: "py-2",
      2.5: "py-2.5",
      3: "py-3",
      4: "py-4",
      5: "py-5",
      6: "py-6",
      8: "py-8",
      10: "py-10",
      12: "py-12",
      16: "py-16",
      "responsive": "py-4 sm:py-6 md:py-6 lg:py-8 xl:py-10 2xl:py-10",
    },
    paddingTop: {
      none: "",
      0: "pt-0",
      1: "pt-1",
      2: "pt-2",
      3: "pt-3",
      4: "pt-4",
      5: "pt-5",
      6: "pt-6",
      8: "pt-8",
      10: "pt-10",
      12: "pt-12",
      16: "pt-16",
    },
    paddingBottom: {
      none: "",
      0: "pb-0",
      1: "pb-1",
      2: "pb-2",
      3: "pb-3",
      4: "pb-4",
      5: "pb-5",
      6: "pb-6",
      8: "pb-8",
      10: "pb-10",
      12: "pb-12",
      16: "pb-16",
    },
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
    hover: {
      none: "",
      default: "hover:bg-primary/10",
      destructive: "hover:bg-destructive/10",
      "accent-10": "hover:bg-accent/10",
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
    cursor: {
      none: "",
      pointer: "cursor-pointer",
    },
    textAlign: {
      none: "",
      center: "text-center",
      left: "text-left",
    },
    flex: {
      none: "",
      "1": "flex-1",
      auto: "flex-auto",
      initial: "flex-initial",
      normal: "",
    },
    grow: {
      true: "grow",
      false: "",
    },
    truncate: {
      true: "truncate",
      false: "",
    },
    lineClamp: {
      none: "",
      "1": "line-clamp-1",
      "2": "line-clamp-2",
      "3": "line-clamp-3",
    },
    display: {
      none: "",
      "hidden-md-flex": "hidden md:flex",
    },
    blur: {
      none: "",
      "xl": "blur-xl",
      "2xl": "blur-2xl",
      "3xl": "blur-3xl",
    },
    animate: {
      none: "",
      pulse: "animate-pulse",
    },
  },
  defaultVariants: {
    direction: "row",
    align: "normal",
    justify: "normal",
    gap: 0,
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

export interface FlexProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "style">,
  Omit<VariantProps<typeof flexVariants>, "flex" | "gap" | "wrap"> {
  /**
   * Custom element type (alias for `as` prop)
   * @default "div"
   */
  component?: React.ComponentType<React.HTMLAttributes<HTMLElement>>
  /**
   * Is direction of the flex vertical, use flex-direction: column
   * @default false
   */
  vertical?: boolean
  /**
   * Direction of the flex (horizontal | vertical)
   * @default "horizontal"
   */
  orientation?: "horizontal" | "vertical"
  /**
   * flex CSS shorthand properties
   * @default "normal"
   */
  flex?: "none" | "1" | "auto" | "initial" | "normal" | string
  /**
   * Sets the gap between grids
   * Supports: small | middle | large | string | number
   * @default 0
   */
  gap?: VariantProps<typeof flexVariants>["gap"] | string | number
  /**
   * Set whether the element is displayed in a single line or in multiple lines
   * Supports: flex-wrap | boolean
   * @default false (nowrap)
   */
  wrap?: VariantProps<typeof flexVariants>["wrap"] | boolean
  /**
   * Alias for `as` prop to match Ant Design API
   */
  as?: React.ElementType
  /**
   * Inline styles
   */
  style?: React.CSSProperties
}

export const Flex = React.forwardRef<HTMLDivElement, FlexProps>(
  ({ 
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
  }, ref) => {
    // Map vertical/orientation to direction
    // Priority: direction > vertical > orientation
    const computedDirection = direction 
      ? direction
      : (vertical || orientation === "vertical") 
        ? "col"
        : "row"
    
    // Handle flex prop with inline style if it's a custom value
    const flexStyle: React.CSSProperties = { ...style }
    const isStandardFlex = flexProp === "normal" || flexProp === "none" || flexProp === "1" || flexProp === "auto" || flexProp === "initial"
    const flexVariant = isStandardFlex ? flexProp : "normal"
    
    if (flexProp && !isStandardFlex) {
      // Custom flex value (string like "1 1 auto")
      flexStyle.flex = flexProp
    }
    
    // Handle gap prop with custom string/number values
    // Check if gap is a valid variant value
    const validGapVariants: (string | number)[] = [0, 0.5, 1, 1.5, 2, 3, 4, 5, 6, 8, 12, 16, "small", "middle", "large", "6-lg-8", "2-md-4", "2-lg-6", "4-lg-6", "4-lg-8", "responsive"]
    let gapVariant: VariantProps<typeof flexVariants>["gap"] | undefined = undefined
    
    if (gap !== undefined && gap !== null) {
      if (validGapVariants.includes(gap as string | number)) {
        // Standard gap value - use variant
        gapVariant = gap as VariantProps<typeof flexVariants>["gap"]
      } else {
        // Custom gap value (string like "10px" or number like 10) - use inline style
        if (typeof gap === "number") {
          flexStyle.gap = `${gap * 0.25}rem` // Convert to rem (assuming 4px base)
        } else if (typeof gap === "string") {
          flexStyle.gap = gap
        }
      }
    }
    
    return (
      <Component
        ref={ref}
        className={cn(flexVariants({ 
          direction: computedDirection, 
          align, 
          justify, 
          gap: gapVariant, 
          gapX, 
          gapY, 
          wrap: wrap === true ? "wrap" : wrap === false ? "nowrap" : wrap, 
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
          flex: flexVariant, 
          grow, 
          truncate, 
          lineClamp, 
          display, 
          objectFit, 
          imageStyle, 
          blur, 
          animate 
        }), className)}
        style={Object.keys(flexStyle).length > 0 ? flexStyle : undefined}
        {...props}
      />
    )
  }
)

Flex.displayName = "Flex"

