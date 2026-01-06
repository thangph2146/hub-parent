import { useState, useCallback } from "react"
import { resourceLogger } from "@/lib/config/resource-logger"
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
      resourceLogger.actionFlow({
        resource: "students",
        action: "toggle-status",
        step: "init",
        metadata: {
          operation: "open_confirm_dialog",
          resourceId: row.id,
          recordName: row.studentCode,
          newStatus,
          currentStatus: row.isActive,
          userAction: "user_clicked_toggle",
        },
      })
      
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
    resourceLogger.actionFlow({
      resource: "students",
      action: "toggle-status",
      step: "init",
      metadata: {
        operation: "close_confirm_dialog",
        userAction: "user_cancelled_or_closed_dialog",
      },
    })
    
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

