import { useState, useCallback } from "react"

export interface BulkToggleConfirmState {
  open: boolean
  ids: string[]
  count: number
  newStatus: boolean
  onConfirm: () => Promise<void>
}

export const useStudentToggleConfirm = () => {
  const [bulkToggleConfirm, setBulkToggleConfirm] = useState<BulkToggleConfirmState | null>(null)

  const openBulkToggleConfirm = useCallback(
    (ids: string[], count: number, newStatus: boolean, onConfirm: () => Promise<void>) => {
      setBulkToggleConfirm({
        open: true,
        ids,
        count,
        newStatus,
        onConfirm,
      })
    },
    []
  )

  const closeBulkToggleConfirm = useCallback(() => {
    setBulkToggleConfirm(null)
  }, [])

  return {
    bulkToggleConfirm,
    openBulkToggleConfirm,
    closeBulkToggleConfirm,
  }
}

