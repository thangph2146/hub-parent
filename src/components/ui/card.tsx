import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { headingSizes, fontWeights, responsiveTextSizes, fontWeights as fw, lineHeights } from "@/lib/typography"

const cardTitleDefault = `${headingSizes.h4} ${fontWeights.bold}`
const cardBodySmall = `${responsiveTextSizes.small} ${fw.normal} ${lineHeights.relaxed}`

const cardVariants = cva(
  "bg-card text-card-foreground flex flex-col gap-6 rounded-xl border shadow-sm",
  {
    variants: {
      padding: {
        none: "",
        xs: "p-1",
        sm: "p-2",
        md: "p-4",
        lg: "p-6",
        xl: "p-8",
        default: "py-6",
        "hero": "p-4 sm:p-6 lg:p-8 gap-0",
        "0": "p-0",
        "form": "p-6 md:p-8",
      },
      fullWidth: {
        true: "w-full",
        false: "",
      },
      maxWidth: {
        none: "",
        "sm": "max-w-sm",
        "md": "max-w-md",
        "lg": "max-w-lg",
        "hero": "max-w-sm md:max-w-md lg:max-w-lg",
      },
      overlay: {
        none: "",
        "white-90": "bg-white/90 dark:bg-card/90 backdrop-blur-md shadow-xl border border-white/20 dark:border-border",
      },
      overflow: {
        none: "",
        hidden: "overflow-hidden",
        auto: "overflow-auto",
      },
    },
    defaultVariants: {
      padding: "default",
      fullWidth: true,
      maxWidth: "none",
      overlay: "none",
      overflow: "none",
    },
  }
)

export interface CardProps
  extends React.ComponentProps<"div">,
    VariantProps<typeof cardVariants> {}

function Card({ className, padding, fullWidth, maxWidth, overlay, overflow, ...props }: CardProps) {
  return (
    <div
      data-slot="card"
      className={cn(cardVariants({ padding, fullWidth, maxWidth, overlay, overflow }), className)}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-2 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6",
        className
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn(cardTitleDefault, className)}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn(`text-muted-foreground ${cardBodySmall}`, className)}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  )
}

const cardContentVariants = cva("px-6", {
  variants: {
    padding: {
      none: "p-0",
      default: "",
      "md": "p-6 md:p-8",
    },
    grid: {
      none: "",
      "2": "grid grid-cols-1 md:grid-cols-2",
    },
  },
  defaultVariants: {
    padding: "default",
    grid: "none",
  },
})

export interface CardContentProps extends React.ComponentProps<"div"> {
  padding?: "none" | "default" | "md"
  grid?: "none" | "2"
}

function CardContent({ className, padding, grid, ...props }: CardContentProps) {
  return (
    <div
      data-slot="card-content"
      className={cn(cardContentVariants({ padding, grid }), className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center px-6 [.border-t]:pt-6", className)}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}
