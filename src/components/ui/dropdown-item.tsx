"use client"

import * as React from "react"
import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/utils"

export interface DropdownItemProps {
  value: string
  options: { label: string; value: string }[]
  onValueChange: (value: string) => void
  ariaLabel?: string
  className?: string
}

export function DropdownItem({
  value,
  options,
  onValueChange,
  ariaLabel,
  className,
}: DropdownItemProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [isOpen])

  const selectedOption = options.find((opt) => opt.value === value)

  return (
    <div className={cn("relative", className)} ref={containerRef}>
      <Button
        variant="outline"
        size="sm"
        className="h-8 w-fit min-w-[60px] justify-between gap-1 px-2 font-normal"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={ariaLabel}
        type="button"
      >
        <span className="truncate">{selectedOption?.label || value}</span>
        <ChevronDown className="h-3 w-3 opacity-50 shrink-0" />
      </Button>
      {isOpen && (
        <div className="absolute left-0 top-full z-[100] mt-1 min-w-[100px] overflow-hidden rounded-md border bg-popover shadow-md animate-in fade-in-0 zoom-in-95">
          <ScrollArea className="h-[200px]">
            <div className="flex flex-col p-1">
              {options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={cn(
                    "flex w-full items-center rounded-sm px-2 py-1.5 text-left text-xs outline-none transition-colors hover:bg-accent hover:text-accent-foreground",
                    value === option.value && "bg-accent text-accent-foreground font-medium"
                  )}
                  onClick={() => {
                    onValueChange(option.value)
                    setIsOpen(false)
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  )
}
