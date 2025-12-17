import { useDeleteConfirm } from "@/features/admin/resources/hooks"
import type { NotificationRow } from "../types"

export const useNotificationDeleteConfirm = () => {
  const { deleteConfirm, setDeleteConfirm, handleDeleteConfirm: baseHandleDeleteConfirm } = useDeleteConfirm<NotificationRow>()
  
  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return
    await deleteConfirm.onConfirm()
    setDeleteConfirm(null)
  }

  return {
    deleteConfirm,
    setDeleteConfirm,
    handleDeleteConfirm,
  }
}

