/**
 * View Mode Toggle Component
 * Component để chuyển đổi giữa tree và flat view
 */

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Folder, List } from "lucide-react"

interface ViewModeToggleProps {
  viewMode: "flat" | "tree"
  onViewModeChange: (mode: "flat" | "tree") => void
}

export function ViewModeToggle({ viewMode, onViewModeChange }: ViewModeToggleProps) {
  return (
    <div className="flex items-center gap-1 sm:gap-2">
      <Button
        type="button"
        variant={viewMode === "tree" ? "default" : "outline"}
        size="sm"
        onClick={() => onViewModeChange("tree")}
        className="text-xs px-2 gap-1"
      >
        <Folder className="h-4 w-4" />
        <span className="inline">Thư mục</span>
      </Button>
      <Button
        type="button"
        variant={viewMode === "flat" ? "default" : "outline"}
        size="sm"
        onClick={() => onViewModeChange("flat")}
        className="text-xs px-2 gap-1"
      >
        <List className="h-4 w-4" />
        <span className="inline">Danh sách</span>
      </Button>
    </div>
  )
}

