import { useCallback, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/services/api/axios"
import { apiRoutes } from "@/constants"
import { queryKeys } from "@/constants"
import { useResourceActions, useResourceBulkProcessing } from "@/features/admin/resources/hooks"
import type { CommentRow } from "../types"
import type { FeedbackVariant } from "@/components/dialogs"
import { COMMENT_MESSAGES } from "../constants/messages"
import { resourceLogger } from "@/utils"
import type { BulkActionResult } from "@/features/admin/resources/types"
import { toast } from "@/hooks"

interface UseCommentActionsOptions {
  canApprove: boolean
  canDelete: boolean
  canRestore: boolean
  canManage: boolean
  isSocketConnected?: boolean
  showFeedback: (variant: FeedbackVariant, title: string, description?: string, details?: string) => void
  refreshTable?: () => Promise<void>
}

export const useCommentActions = ({
  canApprove,
  canDelete,
  canRestore,
  canManage,
  isSocketConnected,
  showFeedback,
  refreshTable,
}: UseCommentActionsOptions) => {
  const queryClient = useQueryClient()
  const [approvingComments, setApprovingComments] = useState<Set<string>>(new Set())
  const [unapprovingComments, setUnapprovingComments] = useState<Set<string>>(new Set())
  const [togglingComments, setTogglingComments] = useState<Set<string>>(new Set())

  const {
    executeSingleAction: baseExecuteSingleAction,
    deletingIds: deletingComments,
    restoringIds: restoringComments,
    hardDeletingIds: hardDeletingComments,
    bulkState: baseBulkState,
  } = useResourceActions<CommentRow>({
    resourceName: "comments",
    queryKeys: {
      all: () => queryKeys.adminComments.all(),
      detail: (id) => queryKeys.adminComments.detail(id),
    },
    apiRoutes: {
      delete: (id) => apiRoutes.comments.delete(id),
      restore: (id) => apiRoutes.comments.restore(id),
      hardDelete: (id) => apiRoutes.comments.hardDelete(id),
      bulk: apiRoutes.comments.bulk,
    },
    messages: COMMENT_MESSAGES,
    getRecordName: (row) => row.authorName || row.authorEmail,
    permissions: {
      canDelete,
      canRestore,
      canManage,
    },
    showFeedback,
    isSocketConnected,
    getLogMetadata: (row) => ({
      commentId: row.id,
      authorName: row.authorName,
      authorEmail: row.authorEmail,
    }),
  })

  const executeSingleAction = useCallback(
    async (
      action: "delete" | "restore" | "hard-delete",
      row: CommentRow
    ): Promise<void> => {
      await baseExecuteSingleAction(action, row, async () => {})
      await refreshTable?.()
    },
    [baseExecuteSingleAction, refreshTable]
  )

  const handleToggleApprove = useCallback(
    async (row: CommentRow, newStatus: boolean) => {
      if (!canApprove) {
        toast({
          variant: "destructive",
          title: COMMENT_MESSAGES.NO_PERMISSION,
          description: COMMENT_MESSAGES.NO_APPROVE_PERMISSION,
        })
        return
      }

      const setLoadingState = newStatus ? setApprovingComments : setUnapprovingComments
      setTogglingComments((prev) => new Set(prev).add(row.id))
      setLoadingState((prev) => new Set(prev).add(row.id))

      // Hiển thị loading toast
      const loadingToastId = toast({
        title: "Đang thay đổi trạng thái...",
        description: `Đang ${newStatus ? "duyệt" : "hủy duyệt"} bình luận từ ${row.authorName || row.authorEmail}`,
      })

      try {
        resourceLogger.logFlow({
          resource: "comments",
          action: newStatus ? "approve" : "unapprove",
          step: "start",
          details: {
            commentId: row.id,
            authorName: row.authorName,
          },
        })

        if (newStatus) {
          await apiClient.post(apiRoutes.comments.approve(row.id))
        } else {
          await apiClient.post(apiRoutes.comments.unapprove(row.id))
        }

        resourceLogger.logFlow({
          resource: "comments",
          action: newStatus ? "approve" : "unapprove",
          step: "success",
          details: {
            commentId: row.id,
            authorName: row.authorName,
          },
        })
        
        // Dismiss loading toast và hiển thị success toast
        loadingToastId.dismiss()
        toast({
          variant: "success",
          title: newStatus ? COMMENT_MESSAGES.APPROVE_SUCCESS : COMMENT_MESSAGES.UNAPPROVE_SUCCESS,
          description: newStatus 
            ? `Đã duyệt bình luận từ ${row.authorName || row.authorEmail}`
            : `Đã hủy duyệt bình luận từ ${row.authorName || row.authorEmail}`,
        })
        
        // Chỉ invalidate queries - table sẽ tự động refresh qua query cache events
        await queryClient.invalidateQueries({ queryKey: queryKeys.adminComments.all(), refetchType: "active" })
        await queryClient.invalidateQueries({ queryKey: queryKeys.adminComments.detail(row.id), refetchType: "active" })
      } catch (error: unknown) {
        let errorMessage: string = COMMENT_MESSAGES.UNKNOWN_ERROR
        if (error && typeof error === "object" && "response" in error) {
          const axiosError = error as { response?: { data?: { message?: string; error?: string } } }
          errorMessage = axiosError.response?.data?.message || axiosError.response?.data?.error || COMMENT_MESSAGES.UNKNOWN_ERROR
        } else if (error instanceof Error) {
          errorMessage = error.message
        }
        resourceLogger.logFlow({
          resource: "comments",
          action: newStatus ? "approve" : "unapprove",
          step: "error",
          details: {
            commentId: row.id,
            authorName: row.authorName,
            error: errorMessage,
          },
        })

        // Dismiss loading toast và hiển thị error toast
        loadingToastId.dismiss()
        toast({
          variant: "destructive",
          title: newStatus ? COMMENT_MESSAGES.APPROVE_ERROR : COMMENT_MESSAGES.UNAPPROVE_ERROR,
          description: `Không thể ${newStatus ? "duyệt" : "hủy duyệt"} bình luận. ${errorMessage}`,
        })
        await refreshTable?.()
      } finally {
        setTogglingComments((prev) => {
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
    [canApprove, queryClient, refreshTable],
  )

  const { bulkState, startBulkProcessing, stopBulkProcessing } = useResourceBulkProcessing()
  const executeBulkAction = useCallback(
    async (
      action: "delete" | "restore" | "hard-delete" | "approve" | "unapprove",
      ids: string[],
      clearSelection: () => void
    ) => {
      if (ids.length === 0) return

      if (!startBulkProcessing()) return

      try {
        resourceLogger.logAction({
          resource: "comments",
          action,
          count: ids.length,
          commentIds: ids,
        })
        const response = await apiClient.post<{ data: BulkActionResult }>(apiRoutes.comments.bulk, { action, ids })

        const successTitles = {
          approve: COMMENT_MESSAGES.BULK_APPROVE_SUCCESS,
          unapprove: COMMENT_MESSAGES.BULK_UNAPPROVE_SUCCESS,
          restore: COMMENT_MESSAGES.BULK_RESTORE_SUCCESS,
          delete: COMMENT_MESSAGES.BULK_DELETE_SUCCESS,
          "hard-delete": COMMENT_MESSAGES.BULK_HARD_DELETE_SUCCESS,
        }
        const title = successTitles[action]
        const description = response.data.data?.message || `Đã thực hiện thao tác cho ${ids.length} bình luận`
        
        // approve/unapprove: sử dụng toast, các actions khác vẫn dùng showFeedback
        if (action === "approve" || action === "unapprove") {
          toast({
            variant: "success",
            title,
            description,
          })
        } else {
          showFeedback("success", title, description)
        }
        clearSelection()

        // Chỉ invalidate queries - table sẽ tự động refresh qua query cache events
        await queryClient.invalidateQueries({ queryKey: queryKeys.adminComments.all(), refetchType: "active" })
      } catch (error: unknown) {
        await refreshTable?.()
        let errorMessage: string = COMMENT_MESSAGES.UNKNOWN_ERROR
        if (error && typeof error === "object" && "response" in error) {
          const axiosError = error as { response?: { data?: { message?: string; error?: string; data?: { message?: string } } } }
          errorMessage = axiosError.response?.data?.message || axiosError.response?.data?.error || axiosError.response?.data?.data?.message || COMMENT_MESSAGES.UNKNOWN_ERROR
        } else if (error instanceof Error) {
          errorMessage = error.message
        }
        
        const errorTitles = {
          approve: COMMENT_MESSAGES.BULK_APPROVE_ERROR,
          unapprove: COMMENT_MESSAGES.BULK_UNAPPROVE_ERROR,
          restore: COMMENT_MESSAGES.BULK_RESTORE_ERROR,
          delete: COMMENT_MESSAGES.BULK_DELETE_ERROR,
          "hard-delete": COMMENT_MESSAGES.BULK_HARD_DELETE_ERROR,
        }
        resourceLogger.logAction({
          resource: "comments",
          action,
          count: ids.length,
          error: errorMessage,
        })
        
        // approve/unapprove: sử dụng toast, các actions khác vẫn dùng showFeedback
        if (action === "approve" || action === "unapprove") {
          toast({
            variant: "destructive",
            title: errorTitles[action],
            description: `Không thể thực hiện thao tác cho ${ids.length} bình luận. ${errorMessage}`,
          })
        } else {
          showFeedback("error", errorTitles[action], `Không thể thực hiện thao tác cho ${ids.length} bình luận`, errorMessage)
        }
        if (action !== "restore") {
          throw error
        }
      } finally {
        stopBulkProcessing()
      }
    },
    [showFeedback, startBulkProcessing, stopBulkProcessing, queryClient, refreshTable],
  )

  return {
    handleToggleApprove,
    executeSingleAction,
    executeBulkAction,
    approvingComments,
    unapprovingComments,
    togglingComments,
    deletingComments,
    restoringComments,
    hardDeletingComments,
    bulkState: bulkState.isProcessing ? bulkState : baseBulkState,
  }
}
