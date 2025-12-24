import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils/index"
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
      },
      fullWidth: {
        true: "w-full",
        false: "",
      },
    },
    defaultVariants: {
      padding: "default",
      fullWidth: true,
    },
  }
)

export interface CardProps
  extends React.ComponentProps<"div">,
    VariantProps<typeof cardVariants> {}

function Card({ className, padding, fullWidth, ...props }: CardProps) {
  return (
    <div
      data-slot="card"
      className={cn(cardVariants({ padding, fullWidth }), className)}
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

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-6", className)}
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
