import * as React from "react"
import { cn } from "@/lib/utils"
import { typography, iconSizes } from "@/lib/typography"

/**
 * Typography Components
 * Các component typography riêng biệt cho từng loại text
 * Tuân thủ pattern: không gắn className bên ngoài, chỉ sử dụng typography config
 */

export function TypographyH1({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h1 className={cn(typography.heading.h1, className)} {...props}>
      {children}
    </h1>
  )
}

export function TypographyH2({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2 className={cn(typography.heading.h2, className)} {...props}>
      {children}
    </h2>
  )
}

export function TypographyH3({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn(typography.heading.h3, className)} {...props}>
      {children}
    </h3>
  )
}

export function TypographyH4({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h4 className={cn(typography.heading.h4, className)} {...props}>
      {children}
    </h4>
  )
}

export function TypographyH5({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h5 className={cn(typography.heading.h5, className)} {...props}>
      {children}
    </h5>
  )
}

export function TypographyH6({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h6 className={cn(typography.heading.h6, className)} {...props}>
      {children}
    </h6>
  )
}

export function TypographyP({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn(typography.body.medium, className)} {...props}>
      {children}
    </p>
  )
}

export function TypographyPSmall({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn(typography.body.small, className)} {...props}>
      {children}
    </p>
  )
}

export function TypographyPLarge({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn(typography.body.large, className)} {...props}>
      {children}
    </p>
  )
}

export function TypographyPMuted({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn(typography.body.muted.medium, className)} {...props}>
      {children}
    </p>
  )
}

export function TypographyPSmallMuted({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn(typography.body.muted.small, className)} {...props}>
      {children}
    </p>
  )
}

export function TypographyPLargeMuted({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn(typography.body.muted.large, className)} {...props}>
      {children}
    </p>
  )
}

export function TypographySpan({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span className={cn(typography.body.medium, className)} {...props}>
      {children}
    </span>
  )
}

export function TypographySpanSmall({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span className={cn(typography.body.small, className)} {...props}>
      {children}
    </span>
  )
}

export function TypographySpanLarge({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span className={cn(typography.body.large, className)} {...props}>
      {children}
    </span>
  )
}

export function TypographySpanMuted({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span className={cn(typography.body.muted.medium, className)} {...props}>
      {children}
    </span>
  )
}

export function TypographySpanSmallMuted({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span className={cn(typography.body.muted.small, className)} {...props}>
      {children}
    </span>
  )
}

export function TypographySpanLargeMuted({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span className={cn(typography.body.muted.large, className)} {...props}>
      {children}
    </span>
  )
}

export function TypographyTitle({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn(typography.title.default, className)} {...props}>
      {children}
    </div>
  )
}

export function TypographyTitleLarge({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn(typography.title.large, className)} {...props}>
      {children}
    </div>
  )
}

export function TypographyTitleSmall({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn(typography.title.small, className)} {...props}>
      {children}
    </div>
  )
}

export function TypographyDescription({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn(typography.description.default, className)} {...props}>
      {children}
    </div>
  )
}

export function TypographyDescriptionSmall({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn(typography.description.small, className)} {...props}>
      {children}
    </div>
  )
}

export function TypographyDescriptionLarge({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn(typography.description.large, className)} {...props}>
      {children}
    </div>
  )
}

/**
 * Icon Size Helper Component
 * Wrapper để đảm bảo icon sử dụng đúng size từ typography config
 */
export interface IconSizeProps {
  size?: keyof typeof iconSizes
  className?: string
  children: React.ReactNode
}

export function IconSize({ size = "md", className, children }: IconSizeProps) {
  return (
    <span className={cn(iconSizes[size], className)}>
      {children}
    </span>
  )
}

