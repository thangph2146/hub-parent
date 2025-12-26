/**
 * Mode Toggle Buttons Component
 * Component để chuyển đổi giữa các chế độ nhập
 */

import { Button } from "@/components/ui/button"
import { Flex } from "@/components/ui/flex"

interface ModeToggleButtonsProps {
  mode: "tree" | "string"
  onModeChange: (mode: "tree" | "string") => void
  onTreeModeSelect?: () => void
  onStringModeSelect?: () => void
}

export const ModeToggleButtons = ({
  mode,
  onModeChange,
  onTreeModeSelect,
  onStringModeSelect,
}: ModeToggleButtonsProps) => {
  return (
    <Flex direction="col" align="stretch" gap={2} className="sm:flex-row sm:items-center">
      <Button
        type="button"
        variant={mode === "tree" ? "default" : "outline"}
        size="sm"
        onClick={() => {
          onModeChange("tree")
          onTreeModeSelect?.()
        }}
        className="flex-1 sm:flex-initial"
      >
        Tree (chọn từ danh sách)
      </Button>
      <Button
        type="button"
        variant={mode === "string" ? "default" : "outline"}
        size="sm"
        onClick={() => {
          onModeChange("string")
          onStringModeSelect?.()
        }}
        className="flex-1 sm:flex-initial"
      >
        String (nhập đường dẫn)
      </Button>
    </Flex>
  )
}

