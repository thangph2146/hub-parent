import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/utils"
import { responsiveTextSizes, fontWeights, lineHeights } from "@/constants"

const badgeBodySmall = `${responsiveTextSizes.small} ${fontWeights.normal} ${lineHeights.relaxed}`

const badgeVariants = cva(
  `inline-flex items-center rounded-full border px-2.5 py-0.5 font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${badgeBodySmall}`,
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
      },
      shrink: {
        true: "shrink-0",
        false: "w-fit",
      },
      truncate: {
        true: "max-w-full truncate",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      shrink: false,
      truncate: false,
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, shrink, truncate, children, ...props }: BadgeProps) {
  return (
    <div 
      className={cn(badgeVariants({ variant, shrink, truncate }), className)} 
      suppressHydrationWarning
      {...props} 
    >
      {children}
    </div>
  )
}

export { Badge, badgeVariants }


