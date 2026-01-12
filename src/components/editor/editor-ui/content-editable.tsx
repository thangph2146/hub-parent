import { JSX } from "react"
import { ContentEditable as LexicalContentEditable } from "@lexical/react/LexicalContentEditable"
import { cn } from "@/utils"

type Props = {
  placeholder: string
  className?: string
  placeholderClassName?: string
  placeholderDefaults?: boolean // apply default positioning/padding for placeholder
}

export function ContentEditable({
  placeholder,
  className,
  placeholderClassName,
  placeholderDefaults = true,
}: Props): JSX.Element {
  return (
    <LexicalContentEditable
      className={cn("ContentEditable__root relative block min-h-72 px-8 py-4 focus:outline-none", className)}
      aria-placeholder={placeholder}
      aria-label={placeholder || "Editor nội dung"}
      placeholder={
        <div
          className={cn(
            placeholderClassName,
            "text-muted-foreground pointer-events-none select-none",
            placeholderDefaults &&
              "absolute top-0 left-0 overflow-hidden px-8 py-[18px] text-ellipsis"
          )}
        >
          {placeholder}
        </div>
      }
    />
  )
}
