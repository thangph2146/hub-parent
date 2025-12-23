"use client"

import { INSERT_HORIZONTAL_RULE_COMMAND } from "@lexical/react/LexicalHorizontalRuleNode"
import { ScissorsIcon } from "lucide-react"

import { useToolbarContext } from "@/components/editor/context/toolbar-context"
import { SelectItem } from "@/components/ui/select"
import { IconSize } from "@/components/ui/typography"

export function InsertHorizontalRule() {
  const { activeEditor } = useToolbarContext()

  return (
    <SelectItem
      value="horizontal-rule"
      onPointerUp={() =>
        activeEditor.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, undefined)
      }
      className=""
    >
      <div className="flex items-center gap-1">
        <IconSize size="sm">
          <ScissorsIcon />
        </IconSize>
        <span>Horizontal Rule</span>
      </div>
    </SelectItem>
  )
}
