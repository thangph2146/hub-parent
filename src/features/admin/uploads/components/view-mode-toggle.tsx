/**
 * View Mode Toggle Component
 * Component để chuyển đổi giữa tree và flat view
 */

import { Button } from "@/components/ui/button"
import { Folder, List } from "lucide-react"
import { typography } from "@/lib/typography"

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
        className={`${typography.body.small} px-2 gap-1`}
      >
        <Folder className="h-4 w-4" />
        <span className="inline">Thư mục</span>
      </Button>
      <Button
        type="button"
        variant={viewMode === "flat" ? "default" : "outline"}
        size="sm"
        onClick={() => onViewModeChange("flat")}
        className={`${typography.body.small} px-2 gap-1`}
      >
        <List className="h-4 w-4" />
        <span className="inline">Danh sách</span>
      </Button>
    </div>
  )
}

