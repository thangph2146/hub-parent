import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { responsiveTextSizes, fontWeights, lineHeights } from "@/lib/typography"

const textareaBodyMedium = `${responsiveTextSizes.medium} ${fontWeights.normal} ${lineHeights.relaxed}`
const textareaBodySmall = `${responsiveTextSizes.small} ${fontWeights.normal} ${lineHeights.relaxed}`

const textareaVariants = cva(
  `border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content w-full rounded-md border bg-transparent px-3 py-2 ${textareaBodyMedium} shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 [&:read-only]:!opacity-100 [&:read-only]:disabled:!opacity-100 md:${textareaBodySmall}`,
  {
    variants: {
      minHeight: {
        default: "min-h-16",
        "100": "min-h-[100px] sm:min-h-[120px]",
      },
      error: {
        true: "border-destructive",
        false: "",
      },
    },
    defaultVariants: {
      minHeight: "default",
      error: false,
    },
  }
)

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    VariantProps<typeof textareaVariants> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, minHeight, error, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        data-slot="textarea"
        className={cn(textareaVariants({ minHeight, error }), className)}
        {...props}
      />
    )
  }
)

Textarea.displayName = "Textarea"

export { Textarea }
