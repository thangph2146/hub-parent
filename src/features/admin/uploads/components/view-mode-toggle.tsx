/**
 * View Mode Toggle Component
 * Component để chuyển đổi giữa tree và flat view
 */

import { Button } from "@/components/ui/button"
import { Folder, List } from "lucide-react"
import { IconSize } from "@/components/ui/typography"
import { Flex } from "@/components/ui/flex"

interface ViewModeToggleProps {
  viewMode: "flat" | "tree"
  onViewModeChange: (mode: "flat" | "tree") => void
}

export const ViewModeToggle = ({ viewMode, onViewModeChange }: ViewModeToggleProps) => {
  const handleTreeMode = () => onViewModeChange("tree")
  const handleFlatMode = () => onViewModeChange("flat")

  return (
    <Flex align="center" gap={1.5} className="w-full sm:w-auto">
      <Button
        type="button"
        variant={viewMode === "tree" ? "default" : "outline"}
        size="sm"
        onClick={handleTreeMode}
        className="flex-1 sm:flex-initial px-3 gap-1.5 h-9"
      >
        <IconSize size="sm">
          <Folder />
        </IconSize>
        <span className="inline whitespace-nowrap">Thư mục</span>
      </Button>
      <Button
        type="button"
        variant={viewMode === "flat" ? "default" : "outline"}
        size="sm"
        onClick={handleFlatMode}
        className="flex-1 sm:flex-initial px-3 gap-1.5 h-9"
      >
        <IconSize size="sm">
          <List />
        </IconSize>
        <span className="inline whitespace-nowrap">Danh sách</span>
      </Button>
    </Flex>
  )
}

