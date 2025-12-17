import { useCallback, useState } from "react"

interface DeleteConfirmState<T = unknown> {
  open: boolean
  type: string
  row?: T
  bulkIds?: string[]
  onConfirm: () => Promise<void>
}

export const useDeleteConfirm = <T = unknown>() => {
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirmState<T> | null>(null)

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

