"use client"

import { useState } from "react"
import { $isTableSelection } from "@lexical/table"
import { $isRangeSelection, BaseSelection, FORMAT_TEXT_COMMAND } from "lexical"
import { SubscriptIcon, SuperscriptIcon } from "lucide-react"

import { useToolbarContext } from "@/components/editor/context/toolbar-context"
import { useUpdateToolbarHandler } from "@/components/editor/editor-hooks/use-update-toolbar"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"
import { IconSize } from "@/components/ui/typography"

export function SubSuperToolbarPlugin() {
  const { activeEditor } = useToolbarContext()
  const [isSubscript, setIsSubscript] = useState(false)
  const [isSuperscript, setIsSuperscript] = useState(false)

  const $updateToolbar = (selection: BaseSelection) => {
    if ($isRangeSelection(selection) || $isTableSelection(selection)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setIsSubscript((selection as any).hasFormat("subscript"))
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setIsSuperscript((selection as any).hasFormat("superscript"))
    }
  }

  useUpdateToolbarHandler($updateToolbar)

  return (
    <ToggleGroup
      type="single"
      defaultValue={
        isSubscript ? "subscript" : isSuperscript ? "superscript" : ""
      }
      size="default"
      variant="outline"
    >
      <ToggleGroupItem
        value="subscript"
        size="default"
        aria-label="Toggle subscript"
        onClick={() => {
          activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, "subscript")
        }}
        variant={"outline"}
      >
        <IconSize size="sm">
          <SubscriptIcon />
        </IconSize>
      </ToggleGroupItem>
      <ToggleGroupItem
        value="superscript"
        size="default"
        aria-label="Toggle superscript"
        onClick={() => {
          activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, "superscript")
        }}
        variant={"outline"}
      >
        <IconSize size="sm">
          <SuperscriptIcon />
        </IconSize>
      </ToggleGroupItem>
    </ToggleGroup>
  )
}
