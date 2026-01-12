"use client"

import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/utils"
import { iconSizes, responsiveIconSizes } from "@/constants"

const avatarVariants = cva(
  "relative flex shrink-0 overflow-hidden rounded-full",
  {
    variants: {
      size: {
        xs: iconSizes.xs,
        sm: iconSizes.sm,
        md: iconSizes.md,
        lg: iconSizes.lg,
        xl: iconSizes.xl,
        "2xl": iconSizes["2xl"],
        "3xl": iconSizes["3xl"],
        "4xl": iconSizes["4xl"],
        responsive: responsiveIconSizes.medium,
      },
    },
    defaultVariants: {
      size: "2xl",
    },
  }
)

function Avatar({
  className,
  size,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Root> & VariantProps<typeof avatarVariants>) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      className={cn(avatarVariants({ size }), className)}
      {...props}
    />
  )
}

function AvatarImage({
  className,
  referrerPolicy,
  crossOrigin,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Image> & {
  referrerPolicy?: React.ImgHTMLAttributes<HTMLImageElement>["referrerPolicy"]
  crossOrigin?: React.ImgHTMLAttributes<HTMLImageElement>["crossOrigin"]
}) {
  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      className={cn("aspect-square size-full", className)}
      referrerPolicy={referrerPolicy}
      crossOrigin={crossOrigin}
      {...props}
    />
  )
}

function AvatarFallback({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Fallback>) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn(
        "bg-muted flex size-full items-center justify-center rounded-full",
        className
      )}
      {...props}
    />
  )
}

export { Avatar, AvatarImage, AvatarFallback }

