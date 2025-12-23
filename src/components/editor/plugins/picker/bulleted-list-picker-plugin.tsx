import { INSERT_UNORDERED_LIST_COMMAND } from "@lexical/list"
import { ListIcon } from "lucide-react"

import { ComponentPickerOption } from "@/components/editor/plugins/picker/component-picker-option"
import { IconSize } from "@/components/ui/typography"

export function BulletedListPickerPlugin() {
  return new ComponentPickerOption("Bulleted List", {
    icon: <IconSize size="sm"><ListIcon /></IconSize>,
    keywords: ["bulleted list", "unordered list", "ul"],
    onSelect: (_, editor) =>
      editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined),
  })
}
