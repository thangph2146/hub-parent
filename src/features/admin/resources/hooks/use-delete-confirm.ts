import { useCallback, useState } from "react"

export interface DeleteConfirmState<T = unknown, K extends string = string> {
  open: boolean
  type: K
  row?: T
  bulkIds?: string[]
  onConfirm: () => Promise<void>
}

export const useDeleteConfirm = <T = unknown, K extends string = string>() => {
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirmState<T, K> | null>(null)

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteConfirm) return
    try {
      await deleteConfirm.onConfirm()
    } catch {
      // Error already handled in onConfirm
    } finally {
      setDeleteConfirm(null)
    }
  }, [deleteConfirm])

  return {
    deleteConfirm,
    setDeleteConfirm,
    handleDeleteConfirm,
  }
}

