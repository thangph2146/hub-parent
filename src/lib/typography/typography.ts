/**
 * Shared Typography Configuration
 * Đồng bộ text sizes và header styles cho toàn bộ hệ thống
 */

/**
 * Text Size Classes - Responsive typography scale
 */
export const textSizes = {
  xs: "text-xs",
  sm: "text-sm",
  base: "text-base",
  lg: "text-lg",
  xl: "text-xl",
  "2xl": "text-2xl",
  "3xl": "text-3xl",
  "4xl": "text-4xl",
  "5xl": "text-5xl",
  "6xl": "text-6xl",
} as const

/**
 * Responsive Text Size Classes
 * Mobile-first approach với breakpoints: sm, md, lg, xl
 */
export const responsiveTextSizes = {
  // Small text (body, captions)
  small: "text-xs sm:text-xs md:text-sm",
  // Medium text (body, descriptions)
  medium: "text-xs sm:text-sm md:text-base",
  // Large text (subheadings)
  large: "text-sm sm:text-base md:text-lg",
  // Extra large text (headings)
  xlarge: "text-base sm:text-lg md:text-xl",
} as const

/**
 * Heading Size Classes - Responsive heading scale
 */
export const headingSizes = {
  // H1 - Main page title
  h1: "text-xl sm:text-2xl md:text-3xl lg:text-4xl",
  // H2 - Section title
  h2: "text-lg sm:text-xl md:text-2xl lg:text-3xl",
  // H3 - Subsection title
  h3: "text-base sm:text-lg md:text-xl lg:text-2xl",
  // H4 - Card title, small section
  h4: "text-sm sm:text-base md:text-lg lg:text-xl",
  // H5 - Small heading
  h5: "text-xs sm:text-sm md:text-base lg:text-lg",
  // H6 - Smallest heading
  h6: "text-xs sm:text-xs md:text-sm lg:text-base",
} as const

/**
 * Font Weight Classes
 */
export const fontWeights = {
  normal: "font-normal",
  medium: "font-medium",
  semibold: "font-semibold",
  bold: "font-bold",
} as const

/**
 * Line Height Classes
 */
export const lineHeights = {
  tight: "leading-tight",
  normal: "leading-normal",
  relaxed: "leading-relaxed",
  loose: "leading-loose",
} as const

/**
 * Text Color Classes
 */
export const textColors = {
  foreground: "text-foreground",
  muted: "text-muted-foreground",
  primary: "text-primary",
  secondary: "text-secondary",
  accent: "text-accent-foreground",
  destructive: "text-destructive",
} as const

/**
 * Complete Typography Presets
 */
export const typography = {
  // Body text presets
  body: {
    small: `${responsiveTextSizes.small} ${fontWeights.normal} ${lineHeights.relaxed}`,
    medium: `${responsiveTextSizes.medium} ${fontWeights.normal} ${lineHeights.relaxed}`,
    large: `${responsiveTextSizes.large} ${fontWeights.normal} ${lineHeights.relaxed}`,
    muted: {
      small: `${responsiveTextSizes.small} ${fontWeights.normal} ${lineHeights.relaxed} ${textColors.muted}`,
      medium: `${responsiveTextSizes.medium} ${fontWeights.normal} ${lineHeights.relaxed} ${textColors.muted}`,
      large: `${responsiveTextSizes.large} ${fontWeights.normal} ${lineHeights.relaxed} ${textColors.muted}`,
    },
  },
  // Heading presets
  heading: {
    h1: `${headingSizes.h1} ${fontWeights.bold}`,
    h2: `${headingSizes.h2} ${fontWeights.bold}`,
    h3: `${headingSizes.h3} ${fontWeights.semibold}`,
    h4: `${headingSizes.h4} ${fontWeights.semibold}`,
    h5: `${headingSizes.h5} ${fontWeights.medium}`,
    h6: `${headingSizes.h6} ${fontWeights.medium}`,
    // Primary color headings
    primary: {
      h1: `${headingSizes.h1} ${fontWeights.bold} ${textColors.primary}`,
      h2: `${headingSizes.h2} ${fontWeights.bold} ${textColors.primary}`,
      h3: `${headingSizes.h3} ${fontWeights.semibold} ${textColors.primary}`,
    },
  },
  // Title presets (for cards, sections)
  title: {
    default: `${headingSizes.h4} ${fontWeights.bold}`,
    large: `${headingSizes.h3} ${fontWeights.bold}`,
    small: `${headingSizes.h5} ${fontWeights.semibold}`,
  },
  // Description presets
  description: {
    default: `${responsiveTextSizes.medium} ${fontWeights.normal} ${lineHeights.relaxed} ${textColors.muted}`,
    small: `${responsiveTextSizes.small} ${fontWeights.normal} ${lineHeights.relaxed} ${textColors.muted}`,
    large: `${responsiveTextSizes.large} ${fontWeights.normal} ${lineHeights.relaxed} ${textColors.muted}`,
  },
} as const

/**
 * Header Configuration
 * Styles cho các header components
 */
export const headerConfig = {
  // Main page header (H1)
  main: {
    className: `${headingSizes.h1} ${fontWeights.bold}`,
  },
  // Section header (H2)
  section: {
    className: `${headingSizes.h2} ${fontWeights.bold}`,
  },
  // Subsection header (H3)
  subsection: {
    className: `${headingSizes.h3} ${fontWeights.semibold}`,
  },
  // Card header (H4)
  card: {
    className: `${headingSizes.h4} ${fontWeights.semibold}`,
  },
  // Primary color headers
  primary: {
    main: {
      className: `${headingSizes.h1} ${fontWeights.bold} ${textColors.primary}`,
    },
    section: {
      className: `${headingSizes.h2} ${fontWeights.bold} ${textColors.primary}`,
    },
    subsection: {
      className: `${headingSizes.h3} ${fontWeights.semibold} ${textColors.primary}`,
    },
  },
} as const

