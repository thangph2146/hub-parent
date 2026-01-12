"use client"

import * as React from "react"
import * as CollapsiblePrimitive from "@radix-ui/react-collapsible"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/utils"

const collapsibleVariants = cva("", {
  variants: {
    fullWidth: {
      true: "w-full",
      false: "",
    },
  },
  defaultVariants: {
    fullWidth: false,
  },
})

export interface CollapsibleProps
  extends React.ComponentProps<typeof CollapsiblePrimitive.Root>,
    VariantProps<typeof collapsibleVariants> {}

function Collapsible({
  className,
  fullWidth,
  ...props
}: CollapsibleProps) {
  return (
    <CollapsiblePrimitive.Root
      data-slot="collapsible"
      className={cn(collapsibleVariants({ fullWidth }), className)}
      {...props}
    />
  )
}

function CollapsibleTrigger({
  ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.CollapsibleTrigger>) {
  return (
    <CollapsiblePrimitive.CollapsibleTrigger
      data-slot="collapsible-trigger"
      {...props}
    />
  )
}

function CollapsibleContent({
  className,
  ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.CollapsibleContent>) {
  return (
    <CollapsiblePrimitive.CollapsibleContent
      data-slot="collapsible-content"
      className={cn(
        "overflow-hidden data-[state=closed]:animate-[collapsible-up_0.2s_ease-out] data-[state=open]:animate-[collapsible-down_0.2s_ease-out]",
        className
      )}
      {...props}
    />
  )
}

export { Collapsible, CollapsibleTrigger, CollapsibleContent }

