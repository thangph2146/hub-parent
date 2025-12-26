/**
 * Folder Selector Component
 * Component để chọn folder cho upload
 */

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Field, FieldLabel, FieldDescription, FieldContent } from "@/components/ui/field"
import { Trash2, Loader2 } from "lucide-react"
import { IconSize } from "@/components/ui/typography"
import { Flex } from "@/components/ui/flex"
import { useUploadsStore } from "../store/uploads-store"
import { useDeleteFolder } from "../hooks/use-uploads-queries"
import { FolderTreeSelect } from "./folder-tree-select"
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

  const selectedFolderData = React.useMemo(
    () => availableFolders.find((f) => f.path === selectedFolder),
    [availableFolders, selectedFolder]
  )

  const handleSelect = (path: string | null) => {
    setSelectedFolder(path)
    setFolderTreeSelectOpenUpload(false)
  }

  const handleDeleteClick = () => {
    if (selectedFolder && selectedFolderData && onDeleteFolder) {
      onDeleteFolder(selectedFolder, selectedFolderData.name)
    }
  }

  const isDeleting = deleteFolderMutation.isPending && deleteFolderMutation.variables === selectedFolder

  return (
    <Field>
      <FieldLabel>Chọn thư mục lưu file</FieldLabel>
      <FieldContent>
        <Flex direction="col" align="stretch" gap={2} className="sm:flex-row sm:items-center">
            <FolderTreeSelect
              availableFolders={availableFolders}
              selectedValue={selectedFolder}
              openPaths={openFolderPathsUpload}
              isOpen={folderTreeSelectOpenUpload}
              isLoading={isLoadingFolders}
              placeholder={isLoadingFolders ? "Đang tải..." : "Chọn thư mục (để trống để lưu theo ngày)"}
              rootLabel="Theo ngày (mặc định)"
              onSelect={handleSelect}
              onOpenChange={setFolderTreeSelectOpenUpload}
              setOpenPaths={setOpenFolderPathsUpload}
              onClose={() => setFolderTreeSelectOpenUpload(false)}
            />
          {selectedFolder && (
            <Button
              type="button"
              variant="destructive"
              size="icon"
              onClick={handleDeleteClick}
              disabled={isDeleting}
              title="Xóa thư mục"
              className="shrink-0"
            >
              <IconSize size="sm">
                {isDeleting ? <Loader2 className="animate-spin" /> : <Trash2 />}
              </IconSize>
            </Button>
          )}
        </Flex>
        <FieldDescription>
          {selectedFolder
            ? `File sẽ được lưu vào: ${selectedFolder}/ (upload trực tiếp vào folder này)`
            : "File sẽ được lưu theo ngày tháng năm (YYYY/MM/DD)"}
        </FieldDescription>
      </FieldContent>
    </Field>
  )
}

