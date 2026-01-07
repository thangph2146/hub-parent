import { apiRoutes } from "@/lib/api/routes"
import { queryKeys } from "@/lib/query-keys"
import { useResourceActions, useToggleStatus } from "@/features/admin/resources/hooks"
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
    permissions: { canDelete, canRestore, canManage },
    showFeedback,
  })

  const { handleToggleStatus, togglingIds: togglingSessions } = useToggleStatus<SessionRow>({
    resourceName: "sessions",
    updateRoute: (id) => apiRoutes.sessions.update(id),
    queryKeys: {
      all: () => queryKeys.adminSessions.all(),
      detail: (id) => queryKeys.adminSessions.detail(id),
    },
    messages: SESSION_MESSAGES,
    getRecordName: (row) => row.userName || row.userEmail || "người dùng",
    canManage,
  })

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
