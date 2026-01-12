import * as React from "react"
import { cn } from "@/utils"
import { typography, iconSizes } from "@/constants"

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
    <h1 className={cn(typography.heading.h1, className)} suppressHydrationWarning {...props}>
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
    <h2 className={cn(typography.heading.h2, className)} suppressHydrationWarning {...props}>
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
    <h3 className={cn(typography.heading.h3, className)} suppressHydrationWarning {...props}>
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
    <h4 className={cn(typography.heading.h4, className)} suppressHydrationWarning {...props}>
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
    <h5 className={cn(typography.heading.h5, className)} suppressHydrationWarning {...props}>
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
    <h6 className={cn(typography.heading.h6, className)} suppressHydrationWarning {...props}>
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
    <p className={cn(typography.body.medium, className)} suppressHydrationWarning {...props}>
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
    <p className={cn(typography.body.small, className)} suppressHydrationWarning {...props}>
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
    <p className={cn(typography.body.large, className)} suppressHydrationWarning {...props}>
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
    <p className={cn(typography.body.muted.medium, className)} suppressHydrationWarning {...props}>
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
    <p className={cn(typography.body.muted.small, className)} suppressHydrationWarning {...props}>
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
    <p className={cn(typography.body.muted.large, className)} suppressHydrationWarning {...props}>
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
    <span className={cn(typography.body.medium, className)} suppressHydrationWarning {...props}>
      {children}
    </span>
  )
}

export function TypographySpanWhite({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span className={cn(typography.body.medium, "text-white/80 hover:text-white transition-all duration-200", className)} suppressHydrationWarning {...props}>
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
    <span className={cn(typography.body.small, className)} suppressHydrationWarning {...props}>
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
    <span className={cn(typography.body.large, className)} suppressHydrationWarning {...props}>
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
    <span className={cn(typography.body.muted.medium, "group-hover:text-primary-foreground transition-colors duration-200", className)} suppressHydrationWarning {...props}>
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
    <span className={cn(typography.body.muted.small, className)} suppressHydrationWarning {...props}>
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
    <span className={cn(typography.body.muted.large, className)} suppressHydrationWarning {...props}>
      {children}
    </span>
  )
}

export function TypographySpanDestructive({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span className={cn(typography.body.small, "text-destructive", className)} suppressHydrationWarning {...props}>
      {children}
    </span>
  )
}

export function TypographyLink({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLAnchorElement>) {
  return (
    <a className={cn("underline-offset-2 hover:underline", className)} suppressHydrationWarning {...props}>
      {children}
    </a>
  )
}

export function TypographyTitle({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn(typography.title.default, className)} suppressHydrationWarning {...props}>
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
    <div className={cn(typography.title.large, className)} suppressHydrationWarning {...props}>
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
    <div className={cn(typography.title.small, className)} suppressHydrationWarning {...props}>
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
    <div className={cn(typography.description.default, className)} suppressHydrationWarning {...props}>
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
    <div className={cn(typography.description.small, className)} suppressHydrationWarning {...props}>
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
    <div className={cn(typography.description.large, className)} suppressHydrationWarning {...props}>
      {children}
    </div>
  )
}

/**
 * Icon Size Helper Component
 * Clone element và merge className để đảm bảo icon sử dụng đúng size từ typography config
 */
export interface IconSizeProps {
  size?: keyof typeof iconSizes
  className?: string
  children?: React.ReactNode
}

export function IconSize({ size = "md", className, children }: IconSizeProps) {
  // Clone element và merge className trực tiếp vào icon component
  if (React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<{ className?: string }>, {
      className: cn(iconSizes[size], className, (children as React.ReactElement<{ className?: string }>).props?.className),
    })
  }
  
  // Fallback: nếu không phải valid element, wrap trong span
  return (
    <span className={cn(iconSizes[size], className)} suppressHydrationWarning>
      {children}
    </span>
  )
}


