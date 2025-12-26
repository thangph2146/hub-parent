import { useCallback, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/lib/api/axios"
import { apiRoutes } from "@/lib/api/routes"
import { queryKeys } from "@/lib/query-keys"
import { useResourceActions } from "@/features/admin/resources/hooks"
import { getErrorMessage, invalidateAndRefetchQueries } from "@/lib/utils"
import type { ResourceRefreshHandler } from "@/features/admin/resources/types"
import type { SessionRow } from "../types"
import type { FeedbackVariant } from "@/components/dialogs"
import { SESSION_MESSAGES } from "../constants/messages"

interface UseSessionActionsOptions {
  canDelete: boolean
  canRestore: boolean
  canManage: boolean
  showFeedback: (variant: FeedbackVariant, title: string, description?: string, details?: string) => void
}

export const useSessionActions = ({
  canDelete,
  canRestore,
  canManage,
  showFeedback,
}: UseSessionActionsOptions) => {
  const queryClient = useQueryClient()
  const [togglingSessions, setTogglingSessions] = useState<Set<string>>(new Set())

  const {
    executeSingleAction,
    executeBulkAction,
    deletingIds: deletingSessions,
    restoringIds: restoringSessions,
    hardDeletingIds: hardDeletingSessions,
    bulkState,
  } = useResourceActions<SessionRow>({
    resourceName: "sessions",
    queryKeys: {
      all: () => queryKeys.adminSessions.all(),
      detail: (id) => queryKeys.adminSessions.detail(id),
    },
    apiRoutes: {
      delete: (id) => apiRoutes.sessions.delete(id),
      restore: (id) => apiRoutes.sessions.restore(id),
      hardDelete: (id) => apiRoutes.sessions.hardDelete(id),
      bulk: apiRoutes.sessions.bulk,
    },
    messages: SESSION_MESSAGES,
    getRecordName: (row) => row.userName || row.userEmail || "người dùng",
    permissions: {
      canDelete,
      canRestore,
      canManage,
    },
    showFeedback,
  })

  const handleToggleStatus = useCallback(
    async (row: SessionRow, newStatus: boolean, _refresh: ResourceRefreshHandler) => {
      if (!canManage) {
        showFeedback("error", SESSION_MESSAGES.NO_PERMISSION, SESSION_MESSAGES.NO_MANAGE_PERMISSION)
        return
      }

      setTogglingSessions((prev) => new Set(prev).add(row.id))

      try {
        await apiClient.put(apiRoutes.sessions.update(row.id), {
          isActive: newStatus,
        })

        showFeedback(
          "success",
          newStatus ? SESSION_MESSAGES.TOGGLE_ACTIVE_SUCCESS : SESSION_MESSAGES.TOGGLE_INACTIVE_SUCCESS,
          `Đã ${newStatus ? "kích hoạt" : "vô hiệu hóa"} session của ${row.userName || row.userEmail || "người dùng"}`
        )
        
        // Invalidate và refetch list queries - sử dụng "all" để đảm bảo refetch tất cả queries
        await invalidateAndRefetchQueries(queryClient, queryKeys.adminSessions.all())
        
        // Invalidate và refetch detail query
        await invalidateAndRefetchQueries(queryClient, queryKeys.adminSessions.detail(row.id))
        
        // Gọi refresh callback để cập nhật UI ngay lập tức
        await _refresh()
      } catch (error: unknown) {
        const errorMessage = getErrorMessage(error) || SESSION_MESSAGES.UNKNOWN_ERROR
        showFeedback(
          "error",
          newStatus ? SESSION_MESSAGES.TOGGLE_ACTIVE_ERROR : SESSION_MESSAGES.TOGGLE_INACTIVE_ERROR,
          `Không thể ${newStatus ? "kích hoạt" : "vô hiệu hóa"} session. Vui lòng thử lại.`,
          errorMessage
        )
      } finally {
        setTogglingSessions((prev) => {
          const next = new Set(prev)
          next.delete(row.id)
          return next
        })
      }
    },
    [canManage, showFeedback, queryClient],
  )

  return {
    handleToggleStatus,
    executeSingleAction,
    executeBulkAction,
    deletingSessions,
    restoringSessions,
    hardDeletingSessions,
    togglingSessions,
    bulkState,
  }
}
