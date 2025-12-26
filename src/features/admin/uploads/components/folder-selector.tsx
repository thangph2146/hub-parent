/**
 * Folder Selector Component
 * Component để chọn folder cho upload
 */

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Check, Folder, ChevronsUpDown, Trash2, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { TypographyPSmallMuted, IconSize } from "@/components/ui/typography"
import { Flex } from "@/components/ui/flex"
import { useUploadsStore } from "../store/uploads-store"
import { useDeleteFolder } from "../hooks/use-uploads-queries"
import { FolderTreeSelectItem } from "./folder-tree-select-item"
import { useFolderTree } from "../hooks/use-folder-tree"
import { expandFolderTreeLevels } from "../utils/folder-utils"
import type { FolderItem } from "../types"

interface FolderSelectorProps {
  availableFolders: FolderItem[]
  isLoadingFolders: boolean
  onDeleteFolder?: (folderPath: string, folderName: string) => void
}

export const FolderSelector = ({
  availableFolders,
  isLoadingFolders,
  onDeleteFolder,
}: FolderSelectorProps) => {
  const deleteFolderMutation = useDeleteFolder()

  const {
    selectedFolder,
    folderTreeSelectOpenUpload,
    openFolderPathsUpload,
    setSelectedFolder,
    setFolderTreeSelectOpenUpload,
    setOpenFolderPathsUpload,
  } = useUploadsStore()

  const folderTreeForSelect = useFolderTree(availableFolders)

  const handlePopoverOpenChange = React.useCallback(
    (open: boolean) => {
      setFolderTreeSelectOpenUpload(open)
      if (open && openFolderPathsUpload.size === 0) {
        const initialOpenPaths = expandFolderTreeLevels(folderTreeForSelect, 2)
        setOpenFolderPathsUpload(initialOpenPaths)
      }
    },
    [
      folderTreeForSelect,
      openFolderPathsUpload.size,
      setFolderTreeSelectOpenUpload,
      setOpenFolderPathsUpload,
    ]
  )

  const selectedFolderData = React.useMemo(
    () => availableFolders.find((f) => f.path === selectedFolder),
    [availableFolders, selectedFolder]
  )

  const handleDeleteClick = React.useCallback(() => {
    if (selectedFolder && selectedFolderData && onDeleteFolder) {
      onDeleteFolder(selectedFolder, selectedFolderData.name)
    }
  }, [selectedFolder, selectedFolderData, onDeleteFolder])

  return (
    <Flex direction="col" gap={2}>
      <Label className="font-medium">Chọn thư mục lưu file</Label>
      <Flex direction="col" align="stretch" gap={2} className="sm:flex-row sm:items-center">
        <Popover open={folderTreeSelectOpenUpload} onOpenChange={handlePopoverOpenChange}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={folderTreeSelectOpenUpload}
              className="flex-1 justify-between min-w-0"
              disabled={isLoadingFolders}
            >
              <span className="truncate text-left">
                {selectedFolder
                  ? selectedFolderData?.path || selectedFolder
                  : isLoadingFolders
                  ? "Đang tải..."
                  : "Chọn thư mục (để trống để lưu theo ngày)"}
              </span>
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
              <CommandList>
                <CommandEmpty>Không tìm thấy thư mục.</CommandEmpty>
                <CommandGroup>
                  <CommandItem
                    value="__default__"
                    onSelect={() => {
                      setSelectedFolder(null)
                      setFolderTreeSelectOpenUpload(false)
                    }}
                  >
                    <IconSize size="sm" className={cn("mr-2", !selectedFolder ? "opacity-100" : "opacity-0")}>
                      <Check />
                    </IconSize>
                    <IconSize size="sm" className="mr-2 hover:text-foreground">
                      <Folder />
                    </IconSize>
                    Theo ngày (mặc định)
                  </CommandItem>
                  {folderTreeForSelect.map((node) => (
                    <FolderTreeSelectItem
                      key={node.path}
                      node={node}
                      selectedValue={selectedFolder}
                      onSelect={(path) => setSelectedFolder(path)}
                      openPaths={openFolderPathsUpload}
                      setOpenPaths={setOpenFolderPathsUpload}
                      onClose={() => setFolderTreeSelectOpenUpload(false)}
                    />
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        {selectedFolder && (
          <Button
            type="button"
            variant="destructive"
            size="icon"
            onClick={handleDeleteClick}
            disabled={
              deleteFolderMutation.isPending &&
              deleteFolderMutation.variables === selectedFolder
            }
            title="Xóa thư mục"
            className="shrink-0"
          >
            {deleteFolderMutation.isPending &&
            deleteFolderMutation.variables === selectedFolder ? (
              <IconSize size="sm">
                <Loader2 className="animate-spin" />
              </IconSize>
            ) : (
              <IconSize size="sm">
                <Trash2 />
              </IconSize>
            )}
          </Button>
        )}
      </Flex>
      <TypographyPSmallMuted>
        {selectedFolder
          ? `File sẽ được lưu vào: ${selectedFolder}/ (upload trực tiếp vào folder này)`
          : "File sẽ được lưu theo ngày tháng năm (YYYY/MM/DD)"}
      </TypographyPSmallMuted>
    </Flex>
  )
}

