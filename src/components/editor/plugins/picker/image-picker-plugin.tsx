import { ImageIcon } from "lucide-react"

import { InsertImageDialog } from "@/components/editor/plugins/images-plugin"
import { ComponentPickerOption } from "@/components/editor/plugins/picker/component-picker-option"
import { IconSize } from "@/components/ui/typography"

export function ImagePickerPlugin() {
  return new ComponentPickerOption("Image", {
    icon: <IconSize size="sm"><ImageIcon /></IconSize>,
    keywords: ["image", "photo", "picture", "file"],
    onSelect: (_, editor, showModal) =>
      showModal("Insert Image", (onClose) => (
        <InsertImageDialog activeEditor={editor} onClose={onClose} />
      )),
  })
}
