/**
 * Dialogs Hook
 * Custom hook để quản lý dialog states
 */

import { useState, useCallback } from "react"
import type { ImageItem } from "../types"

export interface BulkDeleteConfirmState {
  open: boolean
  count: number
}

export interface SingleDeleteConfirmState {
  open: boolean
  image: ImageItem | null
}

export interface FolderDeleteConfirmState {
  open: boolean
  folderPath: string
  folderName: string
}

export const useDialogs = () => {
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState<BulkDeleteConfirmState | null>(null)
  const [singleDeleteConfirm, setSingleDeleteConfirm] = useState<SingleDeleteConfirmState | null>(null)
  const [folderDeleteConfirm, setFolderDeleteConfirm] = useState<FolderDeleteConfirmState | null>(null)

  const openBulkDelete = useCallback((count: number) => {
    console.log("openBulkDelete called", { count })
    setBulkDeleteConfirm({ open: true, count })
    console.log("bulkDeleteConfirm state set to:", { open: true, count })
  }, [])

  const closeBulkDelete = useCallback(() => {
    setBulkDeleteConfirm(null)
  }, [])

  const openSingleDelete = useCallback((image: ImageItem) => {
    setSingleDeleteConfirm({ open: true, image })
  }, [])

  const closeSingleDelete = useCallback(() => {
    setSingleDeleteConfirm(null)
  }, [])

  const openFolderDelete = useCallback((folderPath: string, folderName: string) => {
    setFolderDeleteConfirm({ open: true, folderPath, folderName })
  }, [])

  const closeFolderDelete = useCallback(() => {
    setFolderDeleteConfirm(null)
  }, [])

  return {
    bulkDeleteConfirm,
    singleDeleteConfirm,
    folderDeleteConfirm,
    openBulkDelete,
    closeBulkDelete,
    openSingleDelete,
    closeSingleDelete,
    openFolderDelete,
    closeFolderDelete,
  }
}

