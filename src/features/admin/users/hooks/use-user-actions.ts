import { useCallback } from "react"
import { apiRoutes } from "@/lib/api/routes"
import { queryKeys } from "@/lib/query-keys"
import { useResourceActions, useToggleStatus } from "@/features/admin/resources/hooks"
import type { ResourceRefreshHandler } from "@/features/admin/resources/types"
import type { UserRow } from "../types"
import type { FeedbackVariant } from "@/components/dialogs"
import { USER_MESSAGES, PROTECTED_SUPER_ADMIN_EMAIL } from "../constants"

interface UseUserActionsOptions {
  canDelete: boolean
  canRestore: boolean
  canManage: boolean
  showFeedback: (variant: FeedbackVariant, title: string, description?: string, details?: string) => void
}

export const useUserActions = ({
  canDelete,
  canRestore,
  canManage,
  showFeedback,
}: UseUserActionsOptions) => {
  const {
    executeSingleAction: baseExecuteSingleAction,
    executeBulkAction: baseExecuteBulkAction,
    deletingIds: deletingUsers,
    restoringIds: restoringUsers,
    hardDeletingIds: hardDeletingUsers,
    bulkState,
  } = useResourceActions<UserRow>({
    resourceName: "users",
    queryKeys: {
      all: () => queryKeys.adminUsers.all(),
      detail: (id) => queryKeys.adminUsers.detail(id),
    },
    apiRoutes: {
      delete: (id) => apiRoutes.users.delete(id),
      restore: (id) => apiRoutes.users.restore(id),
      hardDelete: (id) => apiRoutes.users.hardDelete(id),
      bulk: apiRoutes.users.bulk,
    },
    messages: USER_MESSAGES,
    getRecordName: (row) => row.email,
    permissions: { canDelete, canRestore, canManage },
    showFeedback,
    getLogMetadata: (row) => ({ userId: row.id, userEmail: row.email }),
  })

  const { handleToggleStatus: executeToggleActive, togglingIds: togglingUsers } = useToggleStatus<UserRow>({
    resourceName: "users",
    updateRoute: (id) => apiRoutes.users.update(id),
    queryKeys: {
      all: () => queryKeys.adminUsers.all(),
      detail: (id) => queryKeys.adminUsers.detail(id),
    },
    messages: USER_MESSAGES,
    getRecordName: (row) => row.email,
    canManage,
    validateToggle: (row, newStatus) => {
      if (row.email === PROTECTED_SUPER_ADMIN_EMAIL && newStatus === false) {
        return { valid: false, error: USER_MESSAGES.CANNOT_DEACTIVATE_SUPER_ADMIN }
      }
      return { valid: true }
    },
  })

  const executeSingleAction = useCallback(
    async (action: "delete" | "restore" | "hard-delete", row: UserRow, _refresh: ResourceRefreshHandler): Promise<void> => {
      if ((action === "delete" || action === "hard-delete") && row.email === PROTECTED_SUPER_ADMIN_EMAIL) {
        showFeedback("error", USER_MESSAGES.CANNOT_DELETE_SUPER_ADMIN, USER_MESSAGES.CANNOT_DELETE_SUPER_ADMIN)
        return
      }
      return baseExecuteSingleAction(action, row, _refresh)
    },
    [baseExecuteSingleAction, showFeedback]
  )

  const executeBulkAction = useCallback(
    async (
      action: "delete" | "restore" | "hard-delete",
      ids: string[],
      rows: UserRow[],
      _refresh: ResourceRefreshHandler,
      clearSelection: () => void
    ) => {
      const deletableRows = rows.filter((row) => row.email !== PROTECTED_SUPER_ADMIN_EMAIL)
      const deletableIds = deletableRows.map((r) => r.id)
      const hasSuperAdmin = rows.some((row) => row.email === PROTECTED_SUPER_ADMIN_EMAIL)

      if (deletableIds.length === 0 && hasSuperAdmin) {
        showFeedback("error", USER_MESSAGES.CANNOT_DELETE_SUPER_ADMIN, USER_MESSAGES.CANNOT_DELETE_SUPER_ADMIN)
        return
      }

      return baseExecuteBulkAction(action, deletableIds, _refresh, clearSelection)
    },
    [baseExecuteBulkAction, showFeedback]
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
