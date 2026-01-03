/**
 * Delete Dialogs Component
 * Component chứa tất cả các confirmation dialogs cho delete operations
 */

import { ConfirmDialog } from "@/components/dialogs/confirm-dialog"
import { logger } from "@/lib/config/logger"
import type {
  BulkDeleteConfirmState,
  SingleDeleteConfirmState,
  FolderDeleteConfirmState,
} from "../hooks/use-dialogs"
import type { ImageItem } from "../types"

interface DeleteDialogsProps {
  bulkDeleteConfirm: BulkDeleteConfirmState | null
  singleDeleteConfirm: SingleDeleteConfirmState | null
  folderDeleteConfirm: FolderDeleteConfirmState | null
  isBulkDeleting: boolean
  isSingleDeleting: (fileName: string) => boolean
  isFolderDeleting: (folderPath: string) => boolean
  onBulkDeleteConfirm: () => void
  onSingleDeleteConfirm: (image: ImageItem) => void
  onFolderDeleteConfirm: (folderPath: string) => void
  onCloseBulkDelete: () => void
  onCloseSingleDelete: () => void
  onCloseFolderDelete: () => void
}

const createCloseHandler = (onClose: () => void) => (open: boolean) => {
  if (!open) onClose()
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
  logger.debug("DeleteDialogs render", {
    bulkDeleteConfirm,
    hasBulkDeleteConfirm: !!bulkDeleteConfirm,
    bulkDeleteConfirmOpen: bulkDeleteConfirm?.open,
  })
  
  return (
    <>
      {bulkDeleteConfirm && (
        <ConfirmDialog
          open={bulkDeleteConfirm.open}
          onOpenChange={createCloseHandler(onCloseBulkDelete)}
          title="Xác nhận xóa nhiều hình ảnh"
          description={`Bạn có chắc chắn muốn xóa ${bulkDeleteConfirm.count} hình ảnh đã chọn? Hành động này không thể hoàn tác.`}
          variant="destructive"
          confirmLabel="Xóa"
          cancelLabel="Hủy"
          onConfirm={onBulkDeleteConfirm}
          isLoading={isBulkDeleting}
        />
      )}

      {singleDeleteConfirm?.image && (
        <ConfirmDialog
          open={singleDeleteConfirm.open}
          onOpenChange={createCloseHandler(onCloseSingleDelete)}
          title="Xác nhận xóa hình ảnh"
          description={`Bạn có chắc chắn muốn xóa hình ảnh "${singleDeleteConfirm.image.originalName}"? Hành động này không thể hoàn tác.`}
          variant="destructive"
          confirmLabel="Xóa"
          cancelLabel="Hủy"
          onConfirm={() => onSingleDeleteConfirm(singleDeleteConfirm.image!)}
          isLoading={isSingleDeleting(singleDeleteConfirm.image.fileName)}
        />
      )}

      {folderDeleteConfirm && (
        <ConfirmDialog
          open={folderDeleteConfirm.open}
          onOpenChange={createCloseHandler(onCloseFolderDelete)}
          title="Xác nhận xóa thư mục"
          description={`Bạn có chắc chắn muốn xóa thư mục "${folderDeleteConfirm.folderPath}"? Tất cả hình ảnh và thư mục con bên trong sẽ bị xóa vĩnh viễn. Hành động này không thể hoàn tác.`}
          variant="destructive"
          confirmLabel="Xóa"
          cancelLabel="Hủy"
          onConfirm={() => onFolderDeleteConfirm(folderDeleteConfirm.folderPath)}
          isLoading={isFolderDeleting(folderDeleteConfirm.folderPath)}
        />
      )}
    </>
  )
}

