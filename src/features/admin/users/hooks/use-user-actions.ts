/**
 * Custom hook để xử lý các actions của users
 * Tách logic xử lý actions ra khỏi component chính để code sạch hơn
 */

import { useCallback, useState } from "react"
import { apiClient } from "@/lib/api/axios"
import { apiRoutes } from "@/lib/api/routes"
import { useResourceBulkProcessing } from "@/features/admin/resources/hooks"
import type { ResourceRefreshHandler } from "@/features/admin/resources/types"
import type { UserRow } from "../types"
import type { FeedbackVariant } from "@/components/dialogs"
import { USER_MESSAGES, PROTECTED_SUPER_ADMIN_EMAIL } from "../constants"
import { resourceLogger } from "@/lib/config"

interface UseUserActionsOptions {
  canDelete: boolean
  canRestore: boolean
  canManage: boolean
  showFeedback: (variant: FeedbackVariant, title: string, description?: string, details?: string) => void
}

export function useUserActions({
  canDelete,
  canRestore,
  canManage,
  showFeedback,
}: UseUserActionsOptions) {
  const [deletingUsers, setDeletingUsers] = useState<Set<string>>(new Set())
  const [restoringUsers, setRestoringUsers] = useState<Set<string>>(new Set())
  const [hardDeletingUsers, setHardDeletingUsers] = useState<Set<string>>(new Set())
  const [togglingUsers, setTogglingUsers] = useState<Set<string>>(new Set())

  const { bulkState, startBulkProcessing, stopBulkProcessing } = useResourceBulkProcessing()

  const executeSingleAction = useCallback(
    async (
      action: "delete" | "restore" | "hard-delete",
      row: UserRow,
      refresh: ResourceRefreshHandler
    ): Promise<void> => {
      // Không cho phép xóa super admin
      if ((action === "delete" || action === "hard-delete") && row.email === PROTECTED_SUPER_ADMIN_EMAIL) {
        showFeedback("error", USER_MESSAGES.CANNOT_DELETE_SUPER_ADMIN, USER_MESSAGES.CANNOT_DELETE_SUPER_ADMIN)
        return
      }

      const actionConfig = {
        delete: {
          permission: canDelete,
          endpoint: apiRoutes.users.delete(row.id),
          method: "delete" as const,
          successTitle: USER_MESSAGES.DELETE_SUCCESS,
          successDescription: `Đã xóa người dùng ${row.email}`,
          errorTitle: USER_MESSAGES.DELETE_ERROR,
          errorDescription: `Không thể xóa người dùng ${row.email}`,
        },
        restore: {
          permission: canRestore,
          endpoint: apiRoutes.users.restore(row.id),
          method: "post" as const,
          successTitle: USER_MESSAGES.RESTORE_SUCCESS,
          successDescription: `Đã khôi phục người dùng "${row.email}"`,
          errorTitle: USER_MESSAGES.RESTORE_ERROR,
          errorDescription: `Không thể khôi phục người dùng "${row.email}"`,
        },
        "hard-delete": {
          permission: canManage,
          endpoint: apiRoutes.users.hardDelete(row.id),
          method: "delete" as const,
          successTitle: USER_MESSAGES.HARD_DELETE_SUCCESS,
          successDescription: `Đã xóa vĩnh viễn người dùng ${row.email}`,
          errorTitle: USER_MESSAGES.HARD_DELETE_ERROR,
          errorDescription: `Không thể xóa vĩnh viễn người dùng ${row.email}`,
        },
      }[action]

      if (!actionConfig.permission) return

      // Track loading state
      const setLoadingState = action === "delete" 
        ? setDeletingUsers 
        : action === "restore" 
        ? setRestoringUsers 
        : setHardDeletingUsers

      setLoadingState((prev) => new Set(prev).add(row.id))

      try {
        if (actionConfig.method === "delete") {
          await apiClient.delete(actionConfig.endpoint)
        } else {
          await apiClient.post(actionConfig.endpoint)
        }
        showFeedback("success", actionConfig.successTitle, actionConfig.successDescription)
        // Socket events đã update cache và trigger refresh qua cacheVersion
        // Không cần manual refresh nữa để tránh duplicate refresh
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : USER_MESSAGES.UNKNOWN_ERROR
        showFeedback("error", actionConfig.errorTitle, actionConfig.errorDescription, errorMessage)
        resourceLogger.actionFlow({
          resource: "users",
          action: action === "delete" ? "delete" : action === "restore" ? "restore" : "hard-delete",
          step: "error",
          metadata: { userId: row.id, userEmail: row.email, error: errorMessage },
        })
        if (action !== "restore") {
          throw error
        }
      } finally {
        setLoadingState((prev) => {
          const next = new Set(prev)
          next.delete(row.id)
          return next
        })
      }
    },
    [canDelete, canRestore, canManage, showFeedback],
  )

  const executeToggleActive = useCallback(
    async (row: UserRow, newStatus: boolean, refresh: ResourceRefreshHandler): Promise<void> => {
      if (!canManage) {
        showFeedback("error", USER_MESSAGES.NO_PERMISSION, USER_MESSAGES.NO_MANAGE_PERMISSION)
        return
      }

      // Không cho phép vô hiệu hóa super admin
      if (row.email === PROTECTED_SUPER_ADMIN_EMAIL && newStatus === false) {
        showFeedback("error", USER_MESSAGES.CANNOT_DEACTIVATE_SUPER_ADMIN, USER_MESSAGES.CANNOT_DEACTIVATE_SUPER_ADMIN)
        return
      }

      setTogglingUsers((prev) => new Set(prev).add(row.id))

      try {
        await apiClient.put(apiRoutes.users.update(row.id), {
          isActive: newStatus,
        })

        showFeedback(
          "success",
          USER_MESSAGES.TOGGLE_ACTIVE_SUCCESS,
          `Đã ${newStatus ? "kích hoạt" : "vô hiệu hóa"} người dùng ${row.email}`
        )
        // Socket events đã update cache và trigger refresh qua cacheVersion
        // Không cần manual refresh nữa để tránh duplicate refresh
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : USER_MESSAGES.UNKNOWN_ERROR
        showFeedback(
          "error",
          USER_MESSAGES.TOGGLE_ACTIVE_ERROR,
          `Không thể ${newStatus ? "kích hoạt" : "vô hiệu hóa"} người dùng. Vui lòng thử lại.`,
          errorMessage
        )
      } finally {
        setTogglingUsers((prev) => {
          const next = new Set(prev)
          next.delete(row.id)
          return next
        })
      }
    },
    [canManage, showFeedback],
  )

  const executeBulkAction = useCallback(
    async (
      action: "delete" | "restore" | "hard-delete",
      ids: string[],
      rows: UserRow[],
      refresh: ResourceRefreshHandler,
      clearSelection: () => void
    ) => {
      if (ids.length === 0) return

      // Filter ra super admin từ danh sách đã chọn
      const deletableRows = rows.filter((row) => row.email !== PROTECTED_SUPER_ADMIN_EMAIL)
      const deletableIds = deletableRows.map((r) => r.id)
      const hasSuperAdmin = rows.some((row) => row.email === PROTECTED_SUPER_ADMIN_EMAIL)

      if (deletableIds.length === 0 && hasSuperAdmin) {
        showFeedback("error", USER_MESSAGES.CANNOT_DELETE_SUPER_ADMIN, USER_MESSAGES.CANNOT_DELETE_SUPER_ADMIN)
        return
      }

      if (!startBulkProcessing()) return

      try {
        await apiClient.post(apiRoutes.users.bulk, { action, ids: deletableIds })

        const messages = {
          restore: { title: USER_MESSAGES.BULK_RESTORE_SUCCESS, description: `Đã khôi phục ${deletableIds.length} người dùng` },
          delete: { title: USER_MESSAGES.BULK_DELETE_SUCCESS, description: `Đã xóa ${deletableIds.length} người dùng` },
          "hard-delete": { title: USER_MESSAGES.BULK_HARD_DELETE_SUCCESS, description: `Đã xóa vĩnh viễn ${deletableIds.length} người dùng` },
        }

        const message = messages[action]
        showFeedback("success", message.title, message.description)
        clearSelection()

        // Socket events đã update cache và trigger refresh qua cacheVersion
        // Không cần manual refresh nữa để tránh duplicate refresh
      } catch (error: unknown) {
        // Extract error message từ response nếu có
        let errorMessage: string = USER_MESSAGES.UNKNOWN_ERROR
        if (error && typeof error === "object" && "response" in error) {
          const axiosError = error as { response?: { data?: { message?: string; error?: string } } }
          errorMessage = axiosError.response?.data?.message || axiosError.response?.data?.error || USER_MESSAGES.UNKNOWN_ERROR
        } else if (error instanceof Error) {
          errorMessage = error.message
        }
        
        const errorTitles = {
          restore: USER_MESSAGES.BULK_RESTORE_ERROR,
          delete: USER_MESSAGES.BULK_DELETE_ERROR,
          "hard-delete": USER_MESSAGES.BULK_HARD_DELETE_ERROR,
        }
        showFeedback("error", errorTitles[action], errorMessage)
        resourceLogger.actionFlow({
          resource: "users",
          action: action === "delete" ? "bulk-delete" : action === "restore" ? "bulk-restore" : "bulk-hard-delete",
          step: "error",
          metadata: {
            requestedCount: ids.length,
            deletableCount: deletableIds.length,
            error: errorMessage,
            requestedIds: ids,
            deletableIds,
            filteredOutCount: ids.length - deletableIds.length,
          },
        })
        if (action !== "restore") {
          throw error
        }
      } finally {
        stopBulkProcessing()
      }
    },
    [showFeedback, startBulkProcessing, stopBulkProcessing],
  )

  return {
    executeSingleAction,
    executeToggleActive,
    executeBulkAction,
    deletingUsers,
    restoringUsers,
    hardDeletingUsers,
    togglingUsers,
    bulkState,
  }
}

