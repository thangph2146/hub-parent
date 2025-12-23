import { Columns3Icon } from "lucide-react"

import { InsertLayoutDialog } from "@/components/editor/plugins/layout-plugin"
import { ComponentPickerOption } from "@/components/editor/plugins/picker/component-picker-option"
import { IconSize } from "@/components/ui/typography"

export function ColumnsLayoutPickerPlugin() {
  return new ComponentPickerOption("Columns Layout", {
    icon: <IconSize size="sm"><Columns3Icon /></IconSize>,
    keywords: ["columns", "layout", "grid"],
    onSelect: (_, editor, showModal) =>
      showModal("Insert Columns Layout", (onClose) => (
        <InsertLayoutDialog activeEditor={editor} onClose={onClose} />
      )),
  })
}
