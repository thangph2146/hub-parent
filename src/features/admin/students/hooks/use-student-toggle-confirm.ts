import { useState, useCallback } from "react"
import type { StudentRow } from "../types"

export interface ToggleConfirmState {
  open: boolean
  row: StudentRow
  newStatus: boolean
  onConfirm: () => Promise<void>
}

export interface BulkToggleConfirmState {
  open: boolean
  ids: string[]
  count: number
  newStatus: boolean
  onConfirm: () => Promise<void>
}

export const useStudentToggleConfirm = () => {
  const [toggleConfirm, setToggleConfirm] = useState<ToggleConfirmState | null>(null)
  const [bulkToggleConfirm, setBulkToggleConfirm] = useState<BulkToggleConfirmState | null>(null)

  const openToggleConfirm = useCallback(
    (row: StudentRow, newStatus: boolean, onConfirm: () => Promise<void>) => {
      setToggleConfirm({
        open: true,
        row,
        newStatus,
        onConfirm,
      })
    },
    []
  )

  const closeToggleConfirm = useCallback(() => {
    setToggleConfirm(null)
  }, [])

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
    toggleConfirm,
    bulkToggleConfirm,
    openToggleConfirm,
    closeToggleConfirm,
    openBulkToggleConfirm,
    closeBulkToggleConfirm,
  }
}

