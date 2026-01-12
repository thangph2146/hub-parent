import * as React from "react"
import { cn } from "@/utils"
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
  iconColor = "muted",
  className 
}: FieldItemProps) => {
  const isBgClass = iconColor.startsWith("bg-")
  const bgProp = isBgClass ? undefined : (iconColor as "muted" | "primary" | "destructive" | undefined)
  
  return (
    <Flex align="start" gap={3} fullWidth className={className}>
      <Flex align="center" justify="center" shrink rounded="lg" bg={bgProp} className={cn("h-10 w-10", isBgClass && iconColor)}>
        <IconSize size="sm"><Icon /></IconSize>
      </Flex>
      <Flex direction="col" gap={1} fullWidth flex="1" minWidth="0">
        <TypographySpanSmallMuted>{label}</TypographySpanSmallMuted>
        {children}
      </Flex>
    </Flex>
  )
}

