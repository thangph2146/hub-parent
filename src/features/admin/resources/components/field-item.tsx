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
  iconColor = "muted",
  className 
}: FieldItemProps) => {
  const isBgClass = iconColor.startsWith("bg-")
  const bgProp = isBgClass ? undefined : (iconColor as "muted" | "primary" | "destructive" | undefined)
  const bgClassName = isBgClass ? iconColor : undefined
  
  return (
    <Flex align="start" fullWidth gap={3} className={className}>
      <Flex align="center" justify="center" shrink className={cn("h-9 w-9", bgClassName)} rounded="lg" bg={bgProp}>
        <IconSize size="sm"><Icon /></IconSize>
    </Flex>
      <Flex direction="col" fullWidth gap={1} flex="1" minWidth="0">
      <TypographySpanSmallMuted>{label}</TypographySpanSmallMuted>
      {children}
    </Flex>
  </Flex>
)
}

