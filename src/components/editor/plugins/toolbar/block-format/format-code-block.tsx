import { $createCodeNode } from "@lexical/code"
import { $setBlocksType } from "@lexical/selection"
import { $getSelection, $isRangeSelection } from "lexical"

import { useToolbarContext } from "@/components/editor/context/toolbar-context"
import { blockTypeToBlockName } from "@/components/editor/plugins/toolbar/block-format/block-format-data"
import { SelectItem } from "@/components/ui/select"
import { Flex } from "@/components/ui/flex"

const BLOCK_FORMAT_VALUE = "code"

export function FormatCodeBlock() {
  const { activeEditor, blockType } = useToolbarContext()

  const formatCode = () => {
    if (blockType !== "code") {
      activeEditor.update(() => {
        let selection = $getSelection()

        if (selection !== null) {
          if (selection.isCollapsed()) {
            $setBlocksType(selection, () => $createCodeNode())
          } else {
            const textContent = selection.getTextContent()
            const codeNode = $createCodeNode()
            selection.insertNodes([codeNode])
            selection = $getSelection()
            if ($isRangeSelection(selection)) {
              selection.insertRawText(textContent)
            }
          }
        }
      })
    }
  }

  return (
    <SelectItem value="code" onPointerDown={formatCode}>
      <Flex align="center" gap={1}>
        {blockTypeToBlockName[BLOCK_FORMAT_VALUE].icon}
        {blockTypeToBlockName[BLOCK_FORMAT_VALUE].label}
      </Flex>
    </SelectItem>
  )
}
