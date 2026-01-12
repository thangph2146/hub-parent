import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/utils"
import { responsiveTextSizes, fontWeights, lineHeights } from "@/constants"

const inputBodyMedium = `${responsiveTextSizes.medium} ${fontWeights.normal} ${lineHeights.relaxed}`
const inputBodySmall = `${responsiveTextSizes.small} ${fontWeights.normal} ${lineHeights.relaxed}`

const inputVariants = cva(
  `file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 ${inputBodyMedium} shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:${inputBodySmall} file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 [&:read-only]:!opacity-100 [&:read-only]:disabled:!opacity-100 md:${inputBodySmall} focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive`,
  {
    variants: {
      paddingLeft: {
        none: "",
        "9": "pl-9",
      },
      paddingRight: {
        none: "",
        "10": "pr-10",
      },
      error: {
        true: "border-destructive",
        false: "",
      },
    },
    defaultVariants: {
      paddingLeft: "none",
      paddingRight: "none",
      error: false,
    },
  }
)

export interface InputProps
  extends React.ComponentProps<"input">,
    VariantProps<typeof inputVariants> {}

function Input({ className, type, paddingLeft, paddingRight, error, ...props }: InputProps) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(inputVariants({ paddingLeft, paddingRight, error }), className)}
      {...props}
    />
  )
}

export { Input }

