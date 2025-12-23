"use client"

import { TableIcon } from "lucide-react"

import { useToolbarContext } from "@/components/editor/context/toolbar-context"
import { InsertTableDialog } from "@/components/editor/plugins/table-plugin"
import { SelectItem } from "@/components/ui/select"
import { IconSize } from "@/components/ui/typography"

export function InsertTable() {
  const { activeEditor, showModal } = useToolbarContext()

  return (
    <SelectItem
      value="table"
      onPointerUp={() =>
        showModal("Insert Table", (onClose) => (
          <InsertTableDialog activeEditor={activeEditor} onClose={onClose} />
        ))
      }
      className=""
    >
      <div className="flex items-center gap-1">
        <IconSize size="sm">
          <TableIcon />
        </IconSize>
        <span>Table</span>
      </div>
    </SelectItem>
  )
}
