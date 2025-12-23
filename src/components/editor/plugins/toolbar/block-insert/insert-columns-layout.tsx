"use client"

import { Columns3Icon } from "lucide-react"

import { useToolbarContext } from "@/components/editor/context/toolbar-context"
import { InsertLayoutDialog } from "@/components/editor/plugins/layout-plugin"
import { SelectItem } from "@/components/ui/select"
import { IconSize } from "@/components/ui/typography"

export function InsertColumnsLayout() {
  const { activeEditor, showModal } = useToolbarContext()

  return (
    <SelectItem
      value="columns"
      onPointerUp={() =>
        showModal("Insert Columns Layout", (onClose) => (
          <InsertLayoutDialog activeEditor={activeEditor} onClose={onClose} />
        ))
      }
      className=""
    >
      <div className="flex items-center gap-1">
        <IconSize size="sm">
          <Columns3Icon />
        </IconSize>
        <span>Columns Layout</span>
      </div>
    </SelectItem>
  )
}
