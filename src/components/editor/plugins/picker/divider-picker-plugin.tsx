import { INSERT_HORIZONTAL_RULE_COMMAND } from "@lexical/react/LexicalHorizontalRuleNode"
import { MinusIcon } from "lucide-react"

import { ComponentPickerOption } from "@/components/editor/plugins/picker/component-picker-option"
import { IconSize } from "@/components/ui/typography"

export function DividerPickerPlugin() {
  return new ComponentPickerOption("Divider", {
    icon: <IconSize size="sm"><MinusIcon /></IconSize>,
    keywords: ["horizontal rule", "divider", "hr"],
    onSelect: (_, editor) =>
      editor.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, undefined),
  })
}
