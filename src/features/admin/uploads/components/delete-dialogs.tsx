/**
 * Delete Dialogs Component
 * Component chứa tất cả các confirmation dialogs cho delete operations
 */

import * as React from "react"
import { ConfirmDialog } from "@/components/dialogs/confirm-dialog"
import type {
  BulkDeleteConfirmState,
  SingleDeleteConfirmState,
  FolderDeleteConfirmState,
} from "../hooks/use-dialogs"

interface DeleteDialogsProps {
  bulkDeleteConfirm: BulkDeleteConfirmState | null
  singleDeleteConfirm: SingleDeleteConfirmState | null
  folderDeleteConfirm: FolderDeleteConfirmState | null
  isBulkDeleting: boolean
  isSingleDeleting: (fileName: string) => boolean
  isFolderDeleting: (folderPath: string) => boolean
  onBulkDeleteConfirm: () => void
  onSingleDeleteConfirm: () => void
  onFolderDeleteConfirm: () => void
  onCloseBulkDelete: () => void
  onCloseSingleDelete: () => void
  onCloseFolderDelete: () => void
}

export const DeleteDialogs = ({
  bulkDeleteConfirm,
  singleDeleteConfirm,
  folderDeleteConfirm,
  isBulkDeleting,
  isSingleDeleting,
  isFolderDeleting,
  onBulkDeleteConfirm,
  onSingleDeleteConfirm,
  onFolderDeleteConfirm,
  onCloseBulkDelete,
  onCloseSingleDelete,
  onCloseFolderDelete,
}: DeleteDialogsProps) => {
  return (
    <>
      {/* Bulk Delete Confirmation Dialog */}
      {bulkDeleteConfirm && (
        <ConfirmDialog
          open={bulkDeleteConfirm.open}
          onOpenChange={(open) => {
            if (!open) onCloseBulkDelete()
          }}
          title="Xác nhận xóa nhiều hình ảnh"
          description={`Bạn có chắc chắn muốn xóa ${bulkDeleteConfirm.count} hình ảnh đã chọn? Hành động này không thể hoàn tác.`}
          variant="destructive"
          confirmLabel="Xóa"
          cancelLabel="Hủy"
          onConfirm={onBulkDeleteConfirm}
          isLoading={isBulkDeleting}
        />
      )}

      {/* Single Delete Confirmation Dialog */}
      {singleDeleteConfirm && singleDeleteConfirm.image && (
        <ConfirmDialog
          open={singleDeleteConfirm.open}
          onOpenChange={(open) => {
            if (!open) onCloseSingleDelete()
          }}
          title="Xác nhận xóa hình ảnh"
          description={`Bạn có chắc chắn muốn xóa hình ảnh "${singleDeleteConfirm.image.originalName}"? Hành động này không thể hoàn tác.`}
          variant="destructive"
          confirmLabel="Xóa"
          cancelLabel="Hủy"
          onConfirm={onSingleDeleteConfirm}
          isLoading={isSingleDeleting(singleDeleteConfirm.image.fileName)}
        />
      )}

      {/* Folder Delete Confirmation Dialog */}
      {folderDeleteConfirm && (
        <ConfirmDialog
          open={folderDeleteConfirm.open}
          onOpenChange={(open) => {
            if (!open) onCloseFolderDelete()
          }}
          title="Xác nhận xóa thư mục"
          description={`Bạn có chắc chắn muốn xóa thư mục "${folderDeleteConfirm.folderPath}"? Tất cả hình ảnh và thư mục con bên trong sẽ bị xóa vĩnh viễn. Hành động này không thể hoàn tác.`}
          variant="destructive"
          confirmLabel="Xóa"
          cancelLabel="Hủy"
          onConfirm={onFolderDeleteConfirm}
          isLoading={isFolderDeleting(folderDeleteConfirm.folderPath)}
        />
      )}
    </>
  )
}

