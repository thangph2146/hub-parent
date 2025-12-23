/**
 * View Mode Toggle Component
 * Component để chuyển đổi giữa tree và flat view
 */

import { Button } from "@/components/ui/button"
import { Folder, List } from "lucide-react"
import { IconSize } from "@/components/ui/typography"

interface ViewModeToggleProps {
  viewMode: "flat" | "tree"
  onViewModeChange: (mode: "flat" | "tree") => void
}

export const ViewModeToggle = ({ viewMode, onViewModeChange }: ViewModeToggleProps) => {
  return (
    <div className="flex items-center gap-1 sm:gap-2">
      <Button
        type="button"
        variant={viewMode === "tree" ? "default" : "outline"}
        size="sm"
        onClick={() => onViewModeChange("tree")}
        className="px-2 gap-1"
      >
        <IconSize size="sm">
          <Folder />
        </IconSize>
        <span className="inline">Thư mục</span>
      </Button>
      <Button
        type="button"
        variant={viewMode === "flat" ? "default" : "outline"}
        size="sm"
        onClick={() => onViewModeChange("flat")}
        className="px-2 gap-1"
      >
        <IconSize size="sm">
          <List />
        </IconSize>
        <span className="inline">Danh sách</span>
      </Button>
    </div>
  )
}

