import * as React from "react"
import { cn } from "@/lib/utils"
import { TypographySpanSmallMuted, IconSize } from "@/components/ui/typography"

export interface FieldItemProps {
  icon: React.ComponentType<{ className?: string }>
  label: string
  children: React.ReactNode
  iconColor?: string
  className?: string
}

export const FieldItem = ({ 
  icon: Icon, 
  label, 
  children, 
  iconColor = "bg-muted",
  className 
}: FieldItemProps) => (
  <div className={cn("flex items-start gap-3", className)}>
    <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", iconColor)}>
      <IconSize size="sm">
        <Icon className="text-muted-foreground" />
      </IconSize>
    </div>
    <div className="flex-1 min-w-0">
      <TypographySpanSmallMuted className="mb-1.5">{label}</TypographySpanSmallMuted><br />
      {children}
    </div>
  </div>
)

