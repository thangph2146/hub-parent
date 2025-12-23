"use client"

import { useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ChevronDown, ArrowUpDown, ArrowDownUp } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { IconSize } from "@/components/ui/typography"

const sortOptions = [
  { 
    value: "newest" as const, 
    label: "Mới nhất",
    icon: ArrowDownUp,
  },
  { 
    value: "oldest" as const, 
    label: "Cũ nhất",
    icon: ArrowUpDown,
  },
] as const

export const PostSort = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentSort = (searchParams?.get("sort") || "newest") as "newest" | "oldest"

  const handleSortChange = (value: string) => {
    const params = new URLSearchParams(searchParams?.toString() || "")
    params.set("sort", value)
    params.delete("page") // Reset to page 1 when changing sort
    router.push(`/bai-viet?${params.toString()}`)
  }

  const currentOption = useMemo(
    () => sortOptions.find((opt) => opt.value === currentSort) || sortOptions[0],
    [currentSort]
  )

  const CurrentIcon = currentOption.icon

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <IconSize size="sm">
            <CurrentIcon />
          </IconSize>
          <span>{currentOption.label}</span>
          <IconSize size="sm" className="opacity-50">
            <ChevronDown />
          </IconSize>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40 space-y-1">
        {sortOptions.map((option) => {
          const OptionIcon = option.icon
          const isActive = currentSort === option.value
          return (
            <DropdownMenuItem
              key={option.value}
              onClick={() => handleSortChange(option.value)}
              className={cn(
                "w-full flex items-center gap-2 cursor-pointer",
                isActive && "bg-accent/10 font-medium"
              )}
            >
              <IconSize size="sm">
                <OptionIcon />
              </IconSize>
              <span className="transition-colors">{option.label}</span>
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

