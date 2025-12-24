"use client"

import { ImageIcon } from "lucide-react"

import { useToolbarContext } from "@/components/editor/context/toolbar-context"
import { InsertImageDialog } from "@/components/editor/plugins/images-plugin"
import { SelectItem } from "@/components/ui/select"
import { Flex } from "@/components/ui/flex"
import { IconSize } from "@/components/ui/typography"

export function InsertImage() {
  const { activeEditor, showModal } = useToolbarContext()

  return (
    <SelectItem
      value="image"
      onPointerUp={() => {
        showModal("Insert Image", (onClose) => (
          <InsertImageDialog activeEditor={activeEditor} onClose={onClose} />
        ))
      }}
      className=""
    >
      <Flex align="center" gap={1}>
        <IconSize size="sm">
          <ImageIcon />
        </IconSize>
        <span>Image</span>
      </Flex>
    </SelectItem>
  )
}
