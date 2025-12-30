"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { IconSize } from "@/components/ui/typography"

/**
 * ModeToggle component để chuyển đổi giữa light, dark và system theme
 * Theo hướng dẫn từ shadcn/ui: https://ui.shadcn.com/docs/dark-mode/next
 */
export function ModeToggle() {
  const { setTheme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="group">
          <IconSize size="md" className="scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90 group-hover:text-primary-foreground">
            <Sun />
          </IconSize>
          <IconSize size="md" className="absolute scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0 group-hover:text-primary-foreground">
            <Moon />
          </IconSize>
          <span className="sr-only">Chuyển đổi theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")} className="data-[highlighted]:bg-accent/10 disabled:opacity-50">
          <IconSize size="md" className="mr-2">
            <Sun />
          </IconSize>
          <span>Sáng</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")} className="data-[highlighted]:bg-accent/10 disabled:opacity-50">
          <IconSize size="md" className="mr-2">
            <Moon />
          </IconSize>
          <span>Tối</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

