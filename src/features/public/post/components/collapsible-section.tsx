"use client"

import { ChevronDown } from "lucide-react"
import { iconSizes } from "@/lib/typography"
import { TypographySpanMuted } from "@/components/ui/typography"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
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
          className="w-full justify-between p-0 h-auto hover:bg-transparent"
        >
          <div className="flex items-center gap-2">
            {icon}
            <TypographySpanMuted className="font-medium">{title}</TypographySpanMuted>
          </div>
          <ChevronDown
            className={cn(
              iconSizes.sm, "text-muted-foreground transition-transform duration-200",
              isOpen && "rotate-180"
            )}
          />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-3">
        {children}
      </CollapsibleContent>
    </Collapsible>
  )
}

