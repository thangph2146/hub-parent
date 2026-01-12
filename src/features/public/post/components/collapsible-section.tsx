"use client"

import { ChevronDown } from "lucide-react"
import { TypographySpanMuted, IconSize } from "@/components/ui/typography"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Flex } from "@/components/ui/flex"
import { useState } from "react"
import { cn } from "@/utils"

interface CollapsibleSectionProps {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
  defaultOpen?: boolean
}

export const CollapsibleSection = ({ title, icon, children, defaultOpen = true }: CollapsibleSectionProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className="w-full h-auto group transition-colors"
        >
          <Flex align="center" justify="between" className="w-full py-1.5 px-1">
            <Flex align="center" gap={2} className="flex-1 min-w-0">
              
                {icon}
              <TypographySpanMuted className="font-medium">{title}</TypographySpanMuted>
            </Flex>
            <IconSize 
              size="sm" 
              className={cn(
                "flex-shrink-0 transition-all duration-200",
                isOpen && "rotate-180"
              )}
            >
              <ChevronDown />
            </IconSize>
          </Flex>
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-3 pb-2">
        <div className="pl-1">
          {children}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

