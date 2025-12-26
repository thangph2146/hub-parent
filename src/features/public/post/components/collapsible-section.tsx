"use client"

import { ChevronDown } from "lucide-react"
import { TypographySpanMuted, IconSize } from "@/components/ui/typography"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Flex } from "@/components/ui/flex"
import { useState } from "react"
import { cn } from "@/lib/utils"

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
          className="w-full p-0 h-auto hover:bg-transparent"
        >
          <Flex align="center" justify="between" className="w-full">
            <Flex align="center" gap={2}>
              {icon}
              <TypographySpanMuted>{title}</TypographySpanMuted>
            </Flex>
            <IconSize size="sm" className={cn("transition-transform duration-200", isOpen && "rotate-180")}>
              <ChevronDown />
            </IconSize>
          </Flex>
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        {children}
      </CollapsibleContent>
    </Collapsible>
  )
}

