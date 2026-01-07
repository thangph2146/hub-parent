import { useCallback } from "react"
import { apiRoutes } from "@/lib/api/routes"
import { queryKeys } from "@/lib/query-keys"
import { useResourceActions, useToggleStatus } from "@/features/admin/resources/hooks"
import type { ResourceRefreshHandler } from "@/features/admin/resources/types"
import { resourceLogger } from "@/lib/config/resource-logger"
import type { RoleRow } from "../types"
import type { FeedbackVariant } from "@/components/dialogs"
import { ROLE_MESSAGES } from "../constants/messages"

interface UseRoleActionsOptions {
  canDelete: boolean
  canRestore: boolean
  canManage: boolean
  isSocketConnected?: boolean
  showFeedback: (variant: FeedbackVariant, title: string, description?: string, details?: string) => void
}

export const useRoleActions = ({
  canDelete,
  canRestore,
  canManage,
  isSocketConnected,
  showFeedback,
}: UseRoleActionsOptions) => {
  const {
    executeSingleAction: baseExecuteSingleAction,
    executeBulkAction,
    deletingIds: deletingRoles,
    restoringIds: restoringRoles,
    hardDeletingIds: hardDeletingRoles,
    bulkState,
  } = useResourceActions<RoleRow>({
    resourceName: "roles",
    queryKeys: {
      all: () => queryKeys.adminRoles.all(),
      detail: (id) => queryKeys.adminRoles.detail(id),
    },
    apiRoutes: {
      delete: (id) => apiRoutes.roles.delete(id),
      restore: (id) => apiRoutes.roles.restore(id),
      hardDelete: (id) => apiRoutes.roles.hardDelete(id),
      bulk: apiRoutes.roles.bulk,
    },
    messages: ROLE_MESSAGES,
    getRecordName: (row) => row.displayName,
    permissions: { canDelete, canRestore, canManage },
    showFeedback,
    isSocketConnected,
    getLogMetadata: (row) => ({ roleId: row.id, roleName: row.displayName }),
  })

  const { handleToggleStatus, togglingIds: togglingRoles } = useToggleStatus<RoleRow>({
    resourceName: "roles",
    updateRoute: (id) => apiRoutes.roles.update(id),
    queryKeys: {
      all: () => queryKeys.adminRoles.all(),
      detail: (id) => queryKeys.adminRoles.detail(id),
    },
    messages: ROLE_MESSAGES,
    getRecordName: (row) => row.displayName,
    canManage,
    validateToggle: (row) => {
      if (row.name === "super_admin") {
        return { valid: false, error: ROLE_MESSAGES.CANNOT_MODIFY_SUPER_ADMIN }
      }
      return { valid: true }
    },
    onSuccess: async (row, newStatus) => {
      resourceLogger.actionFlow({
        resource: "roles",
        action: "toggle-status",
        step: newStatus ? "success" : "success",
        metadata: { roleId: row.id, roleName: row.displayName, newStatus },
      })
    },
  })

  const executeSingleAction = useCallback(
    async (action: "delete" | "restore" | "hard-delete", row: RoleRow, refresh: ResourceRefreshHandler): Promise<void> => {
      if (row.name === "super_admin") {
        const errorMsg = action === "hard-delete" 
          ? ROLE_MESSAGES.CANNOT_HARD_DELETE_SUPER_ADMIN
          : ROLE_MESSAGES.CANNOT_DELETE_SUPER_ADMIN
        showFeedback("error", errorMsg, errorMsg)
        return
      }
      return baseExecuteSingleAction(action, row, refresh)
    },
    [baseExecuteSingleAction, showFeedback]
  )

  return {
    handleToggleStatus,
    executeSingleAction,
    executeBulkAction,
    togglingRoles,
    deletingRoles,
    restoringRoles,
    hardDeletingRoles,
    bulkState,
  }
}
