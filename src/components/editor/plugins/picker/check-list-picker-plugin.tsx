import { INSERT_CHECK_LIST_COMMAND } from "@lexical/list"
import { ListTodoIcon } from "lucide-react"

import { ComponentPickerOption } from "@/components/editor/plugins/picker/component-picker-option"
import { IconSize } from "@/components/ui/typography"

export function CheckListPickerPlugin() {
  return new ComponentPickerOption("Check List", {
    icon: <IconSize size="sm"><ListTodoIcon /></IconSize>,
    keywords: ["check list", "todo list"],
    onSelect: (_, editor) =>
      editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined),
  })
}
