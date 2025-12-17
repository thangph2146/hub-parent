import { useCallback, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/lib/api/axios"
import { apiRoutes } from "@/lib/api/routes"
import { queryKeys } from "@/lib/query-keys"
import { useResourceActions, useResourceBulkProcessing } from "@/features/admin/resources/hooks"
import type { ResourceRefreshHandler } from "@/features/admin/resources/types"
import type { ContactRequestRow, BulkActionResult } from "../types"
import type { FeedbackVariant } from "@/components/dialogs"
import { CONTACT_REQUEST_MESSAGES } from "../constants/messages"

interface UseContactRequestActionsOptions {
  canDelete: boolean
  canRestore: boolean
  canManage: boolean
  canUpdate: boolean
  isSocketConnected?: boolean
  showFeedback: (variant: FeedbackVariant, title: string, description?: string, details?: string) => void
}

export const useContactRequestActions = ({
  canDelete,
  canRestore,
  canManage,
  canUpdate,
  isSocketConnected,
  showFeedback,
}: UseContactRequestActionsOptions) => {
  const queryClient = useQueryClient()
  const [markingReadRequests, setMarkingReadRequests] = useState<Set<string>>(new Set())
  const [markingUnreadRequests, setMarkingUnreadRequests] = useState<Set<string>>(new Set())
  const [togglingRequests, setTogglingRequests] = useState<Set<string>>(new Set())

  const { bulkState: customBulkState, startBulkProcessing, stopBulkProcessing } = useResourceBulkProcessing()

  const {
    executeSingleAction,
    executeBulkAction,
    deletingIds: deletingRequests,
    restoringIds: restoringRequests,
    hardDeletingIds: hardDeletingRequests,
    bulkState,
  } = useResourceActions<ContactRequestRow>({
    resourceName: "contact-requests",
    queryKeys: {
      all: () => queryKeys.adminContactRequests.all(),
    },
    apiRoutes: {
      delete: (id) => apiRoutes.contactRequests.delete(id),
      restore: (id) => apiRoutes.contactRequests.restore(id),
      hardDelete: (id) => apiRoutes.contactRequests.hardDelete(id),
      bulk: apiRoutes.contactRequests.bulk,
    },
    messages: CONTACT_REQUEST_MESSAGES,
    getRecordName: (row) => row.subject,
    permissions: {
      canDelete,
      canRestore,
      canManage,
    },
    showFeedback,
    isSocketConnected,
    getLogMetadata: (row) => ({
      contactRequestId: row.id,
      subject: row.subject,
      email: row.email,
    }),
  })

  const handleToggleRead = useCallback(
    async (row: ContactRequestRow, newStatus: boolean, refresh?: ResourceRefreshHandler) => {
      if (!canUpdate) {
        showFeedback("error", CONTACT_REQUEST_MESSAGES.NO_PERMISSION, CONTACT_REQUEST_MESSAGES.NO_UPDATE_PERMISSION)
        return
      }

      const setLoadingState = newStatus ? setMarkingReadRequests : setMarkingUnreadRequests
      setTogglingRequests((prev) => new Set(prev).add(row.id))
      setLoadingState((prev) => new Set(prev).add(row.id))

      try {
        await apiClient.put(apiRoutes.contactRequests.update(row.id), { isRead: newStatus })
        
        await queryClient.invalidateQueries({ queryKey: queryKeys.adminContactRequests.all(), refetchType: "active" })
        await queryClient.refetchQueries({ queryKey: queryKeys.adminContactRequests.all(), type: "active" })
        await refresh?.()
        
        showFeedback(
          "success",
          newStatus ? CONTACT_REQUEST_MESSAGES.MARK_READ_SUCCESS : CONTACT_REQUEST_MESSAGES.MARK_UNREAD_SUCCESS,
          newStatus 
            ? `Yêu cầu liên hệ "${row.subject}" đã được đánh dấu là đã đọc.`
            : `Yêu cầu liên hệ "${row.subject}" đã được đánh dấu là chưa đọc.`
        )
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : CONTACT_REQUEST_MESSAGES.UNKNOWN_ERROR
        showFeedback(
          "error",
          newStatus ? CONTACT_REQUEST_MESSAGES.MARK_READ_ERROR : CONTACT_REQUEST_MESSAGES.MARK_UNREAD_ERROR,
          newStatus ? "Không thể đánh dấu đã đọc yêu cầu liên hệ." : "Không thể đánh dấu chưa đọc yêu cầu liên hệ.",
          errorMessage
        )
      } finally {
        setTogglingRequests((prev) => {
          const next = new Set(prev)
          next.delete(row.id)
          return next
        })
        setLoadingState((prev) => {
          const next = new Set(prev)
          next.delete(row.id)
          return next
        })
      }
    },
    [canUpdate, showFeedback, queryClient],
  )

  const handleBulkMarkRead = useCallback(
    async (ids: string[], refresh: ResourceRefreshHandler, clearSelection: () => void) => {
      if (!canManage) {
        showFeedback("error", CONTACT_REQUEST_MESSAGES.NO_PERMISSION, CONTACT_REQUEST_MESSAGES.NO_UPDATE_PERMISSION)
        return
      }

      if (ids.length === 0) return
      if (!startBulkProcessing()) return

      try {
        const response = await apiClient.post<{ data: BulkActionResult }>(apiRoutes.contactRequests.bulk, {
          action: "mark-read",
          ids,
        })

        const result = response.data.data
        const affected = result?.affected ?? 0

        if (affected === 0) {
          showFeedback("error", "Không có thay đổi", "Không có yêu cầu liên hệ nào được đánh dấu đã đọc")
          clearSelection()
          return
        }

        showFeedback(
          "success",
          CONTACT_REQUEST_MESSAGES.MARK_READ_SUCCESS,
          result?.message || `Đã đánh dấu đã đọc ${affected} yêu cầu liên hệ`
        )
        clearSelection()

        await queryClient.invalidateQueries({ queryKey: queryKeys.adminContactRequests.all(), refetchType: "active" })
        await queryClient.refetchQueries({ queryKey: queryKeys.adminContactRequests.all(), type: "active" })
        await refresh?.()
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : CONTACT_REQUEST_MESSAGES.UNKNOWN_ERROR
        showFeedback("error", CONTACT_REQUEST_MESSAGES.MARK_READ_ERROR, "Không thể đánh dấu đã đọc yêu cầu liên hệ.", errorMessage)
      } finally {
        stopBulkProcessing()
      }
    },
    [canManage, showFeedback, queryClient, startBulkProcessing, stopBulkProcessing],
  )

  const handleBulkMarkUnread = useCallback(
    async (ids: string[], refresh: ResourceRefreshHandler, clearSelection: () => void) => {
      if (!canManage) {
        showFeedback("error", CONTACT_REQUEST_MESSAGES.NO_PERMISSION, CONTACT_REQUEST_MESSAGES.NO_UPDATE_PERMISSION)
        return
      }

      if (ids.length === 0) return
      if (!startBulkProcessing()) return

      try {
        const response = await apiClient.post<{ data: BulkActionResult }>(apiRoutes.contactRequests.bulk, {
          action: "mark-unread",
          ids,
        })

        const result = response.data.data
        const affected = result?.affected ?? 0

        if (affected === 0) {
          showFeedback("error", "Không có thay đổi", "Không có yêu cầu liên hệ nào được đánh dấu chưa đọc")
          clearSelection()
          return
        }

        showFeedback(
          "success",
          CONTACT_REQUEST_MESSAGES.MARK_UNREAD_SUCCESS,
          result?.message || `Đã đánh dấu chưa đọc ${affected} yêu cầu liên hệ`
        )
        clearSelection()

        await queryClient.invalidateQueries({ queryKey: queryKeys.adminContactRequests.all(), refetchType: "active" })
        await queryClient.refetchQueries({ queryKey: queryKeys.adminContactRequests.all(), type: "active" })
        await refresh?.()
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : CONTACT_REQUEST_MESSAGES.UNKNOWN_ERROR
        showFeedback("error", CONTACT_REQUEST_MESSAGES.MARK_UNREAD_ERROR, "Không thể đánh dấu chưa đọc yêu cầu liên hệ.", errorMessage)
      } finally {
        stopBulkProcessing()
      }
    },
    [canManage, showFeedback, queryClient, startBulkProcessing, stopBulkProcessing],
  )

  const handleBulkUpdateStatus = useCallback(
    async (ids: string[], status: "NEW" | "IN_PROGRESS" | "RESOLVED" | "CLOSED", refresh: ResourceRefreshHandler, clearSelection: () => void) => {
      if (!canManage) {
        showFeedback("error", CONTACT_REQUEST_MESSAGES.NO_PERMISSION, CONTACT_REQUEST_MESSAGES.NO_UPDATE_PERMISSION)
        return
      }

      if (ids.length === 0) return
      if (!startBulkProcessing()) return

      try {
        const response = await apiClient.post<{ data: BulkActionResult }>(apiRoutes.contactRequests.bulk, {
          action: "update-status",
          ids,
          status,
        })

        const result = response.data.data
        const affected = result?.affected ?? 0

        if (affected === 0) {
          showFeedback("error", "Không có thay đổi", "Không có yêu cầu liên hệ nào được cập nhật trạng thái")
          clearSelection()
          return
        }

        const statusLabels: Record<string, string> = {
          NEW: "Mới",
          IN_PROGRESS: "Đang xử lý",
          RESOLVED: "Đã xử lý",
          CLOSED: "Đã đóng",
        }

        showFeedback(
          "success",
          "Cập nhật trạng thái thành công",
          result?.message || `Đã cập nhật trạng thái thành "${statusLabels[status]}" cho ${affected} yêu cầu liên hệ`
        )
        clearSelection()

        await queryClient.invalidateQueries({ queryKey: queryKeys.adminContactRequests.all(), refetchType: "active" })
        await queryClient.refetchQueries({ queryKey: queryKeys.adminContactRequests.all(), type: "active" })
        await refresh?.()
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : CONTACT_REQUEST_MESSAGES.UNKNOWN_ERROR
        showFeedback("error", "Cập nhật trạng thái thất bại", "Không thể cập nhật trạng thái yêu cầu liên hệ.", errorMessage)
      } finally {
        stopBulkProcessing()
      }
    },
    [canManage, showFeedback, queryClient, startBulkProcessing, stopBulkProcessing],
  )

  return {
    handleToggleRead,
    executeSingleAction,
    executeBulkAction,
    handleBulkMarkRead,
    handleBulkMarkUnread,
    handleBulkUpdateStatus,
    markingReadRequests,
    markingUnreadRequests,
    togglingRequests,
    deletingRequests,
    restoringRequests,
    hardDeletingRequests,
    bulkState: customBulkState.isProcessing ? customBulkState : bulkState,
  }
}
