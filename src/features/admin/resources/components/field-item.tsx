import * as React from "react"
import { cn } from "@/lib/utils"
import { Flex } from "@/components/ui/flex"
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
  <Flex align="start" gap={3} className={className}>
    <Flex align="center" justify="center" className={cn("h-9 w-9 shrink-0 rounded-lg", iconColor)}>
      <IconSize size="sm">
        <Icon />
      </IconSize>
    </Flex>
    <Flex direction="col" gap={1} className="flex-1 min-w-0">
      <TypographySpanSmallMuted>{label}</TypographySpanSmallMuted>
      {children}
    </Flex>
  </Flex>
)

