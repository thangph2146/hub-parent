/**
 * Folder Tree Select Item Component
 * Component recursive để hiển thị folder tree trong select
 */

import * as React from "react"
import { Button } from "@/components/ui/button"
import { CommandItem } from "@/components/ui/command"
import { Folder, ChevronRight, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { TypographySpanSmall, IconSize } from "@/components/ui/typography"
import type { FolderTreeSelectNode } from "../utils/folder-utils"

interface FolderTreeSelectItemProps {
  node: FolderTreeSelectNode
  level?: number
  selectedValue: string | null
  onSelect: (path: string) => void
  openPaths: Set<string>
  setOpenPaths: React.Dispatch<React.SetStateAction<Set<string>>>
  onClose: () => void
}

export const FolderTreeSelectItem = ({
  node,
  level = 0,
  selectedValue,
  onSelect,
  openPaths,
  setOpenPaths,
  onClose,
}: FolderTreeSelectItemProps) => {
  const isSelected = selectedValue === node.path
  const hasChildren = node.children.length > 0
  const isOpen = openPaths.has(node.path)

  return (
    <div key={node.path}>
      <CommandItem
        value={node.path}
        onSelect={() => {
          onSelect(node.path)
          onClose()
        }}
        className={cn("flex items-center gap-2", level > 0 && "ml-4")}
      >
        <IconSize size="sm" className={cn("rounded-sm hover:text-foreground", isSelected ? "opacity-100" : "opacity-0")}>
          <Check />
        </IconSize>
        {!hasChildren && <div className="w-4" />}
        <IconSize size="sm">
          <Folder className="hover:text-foreground" />
        </IconSize>
        <span className="flex-1">{node.name}</span>

        {hasChildren && (
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation()
              setOpenPaths((prev) => {
                const newSet = new Set(prev)
                if (isOpen) {
                  newSet.delete(node.path)
                } else {
                  newSet.add(node.path)
                }
                return newSet
              })
            }}
            className="w-fit px-2 flex items-center justify-end gap-2 hover:bg-muted/10 rounded-sm"
          >
            <TypographySpanSmall>{node.path}</TypographySpanSmall>
            <IconSize size="lg" className={cn("transition-transform hover:text-foreground", isOpen && "rotate-90")}>
              <ChevronRight />
            </IconSize>
          </Button>
        )}
      </CommandItem>
      {hasChildren && isOpen && (
        <div className="ml-4">
          {node.children.map((child) => (
            <FolderTreeSelectItem
              key={child.path}
              node={child}
              level={level + 1}
              selectedValue={selectedValue}
              onSelect={onSelect}
              openPaths={openPaths}
              setOpenPaths={setOpenPaths}
              onClose={onClose}
            />
          ))}
        </div>
      )}
    </div>
  )
}

