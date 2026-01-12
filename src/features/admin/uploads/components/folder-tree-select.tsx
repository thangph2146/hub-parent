/**
 * Folder Tree Select Component
 * Component chung để chọn folder từ tree
 */

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandInput,
  CommandList,
} from "@/components/ui/command"
import { Check, Folder, ChevronsUpDown } from "lucide-react"
import { cn } from "@/utils"
import { IconSize } from "@/components/ui/typography"
import { FolderTreeSelectItem } from "./folder-tree-select-item"
import { useFolderTree } from "../hooks/use-folder-tree"
import { expandFolderTreeLevels } from "../utils/folder-utils"
import type { FolderItem } from "../types"

interface FolderTreeSelectProps {
  availableFolders: FolderItem[]
  selectedValue: string | null
  openPaths: Set<string>
  isOpen: boolean
  isLoading?: boolean
  disabled?: boolean
  placeholder?: string
  rootLabel?: string
  showSearch?: boolean
  onSelect: (path: string | null) => void
  onOpenChange: (open: boolean) => void
  setOpenPaths: React.Dispatch<React.SetStateAction<Set<string>>>
  onClose?: () => void
}

export const FolderTreeSelect = ({
  availableFolders,
  selectedValue,
  openPaths,
  isOpen,
  isLoading = false,
  disabled = false,
  placeholder = "Chọn thư mục",
  rootLabel = "Root (tạo ở thư mục gốc)",
  showSearch = false,
  onSelect,
  onOpenChange,
  setOpenPaths,
  onClose,
}: FolderTreeSelectProps) => {
  const folderTreeForSelect = useFolderTree(availableFolders)

  const handleOpenChange = (open: boolean) => {
    onOpenChange(open)
    if (open && openPaths.size === 0) {
      const initialOpenPaths = expandFolderTreeLevels(folderTreeForSelect, 2)
      setOpenPaths(initialOpenPaths)
    }
  }

  const selectedFolderData = availableFolders.find((f) => f.path === selectedValue)

  const handleRootSelect = () => {
    onSelect(null)
    onClose?.()
  }

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={isOpen}
          className="w-full justify-between"
          disabled={isLoading || disabled}
        >
          {selectedValue
            ? selectedFolderData?.path || selectedValue
            : placeholder}
          <IconSize size="sm" className="ml-2 shrink-0 opacity-50">
            <ChevronsUpDown />
          </IconSize>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="p-0 w-[var(--radix-popover-trigger-width)]"
        align="start"
      >
        <Command>
          {showSearch && <CommandInput placeholder="Tìm kiếm thư mục..." />}
          <CommandList>
            <CommandEmpty>Không tìm thấy thư mục.</CommandEmpty>
            <CommandGroup>
              <CommandItem value="__root__" onSelect={handleRootSelect}>
                <IconSize
                  size="sm"
                  className={cn("mr-2", !selectedValue ? "opacity-100" : "opacity-0")}
                >
                  <Check />
                </IconSize>
                <IconSize size="sm" className="mr-2 hover:text-foreground">
                  <Folder />
                </IconSize>
                {rootLabel}
              </CommandItem>
              {folderTreeForSelect.map((node) => (
                <FolderTreeSelectItem
                  key={node.path}
                  node={node}
                  selectedValue={selectedValue}
                  onSelect={onSelect}
                  openPaths={openPaths}
                  setOpenPaths={setOpenPaths}
                  onClose={onClose}
                />
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

