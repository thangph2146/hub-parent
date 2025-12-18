import * as React from "react"
import { cn } from "@/lib/utils"
import { typography, iconSizes } from "@/lib/typography"

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
      <Icon className={`${iconSizes.sm} text-muted-foreground`} />
    </div>
    <div className="flex-1 min-w-0">
      <div className={`${typography.body.muted.small} font-medium mb-1.5`}>{label}</div>
      {children}
    </div>
  </div>
)

