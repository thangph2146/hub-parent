import { apiRoutes } from "@/lib/api/routes"
import { queryKeys } from "@/lib/query-keys"
import { useResourceActions, useToggleStatus } from "@/features/admin/resources/hooks"
import type { StudentRow } from "../types"
import type { FeedbackVariant } from "@/components/dialogs"
import { STUDENT_MESSAGES } from "../constants/messages"
import { resourceLogger } from "@/lib/config"

interface UseStudentActionsOptions {
  canDelete: boolean
  canRestore: boolean
  canManage: boolean
  canActivate: boolean
  isSocketConnected?: boolean
  showFeedback: (variant: FeedbackVariant, title: string, description?: string, details?: string) => void
}

export const useStudentActions = ({
  canDelete,
  canRestore,
  canManage,
  canActivate,
  isSocketConnected,
  showFeedback,
}: UseStudentActionsOptions) => {
  const {
    executeSingleAction,
    executeBulkAction,
    deletingIds: deletingStudents,
    restoringIds: restoringStudents,
    hardDeletingIds: hardDeletingStudents,
    bulkState,
  } = useResourceActions<StudentRow>({
    resourceName: "students",
    queryKeys: {
      all: () => queryKeys.adminStudents.all(),
      detail: (id) => queryKeys.adminStudents.detail(id),
    },
    apiRoutes: {
      delete: (id) => apiRoutes.students.delete(id),
      restore: (id) => apiRoutes.students.restore(id),
      hardDelete: (id) => apiRoutes.students.hardDelete(id),
      bulk: apiRoutes.students.bulk,
    },
    messages: STUDENT_MESSAGES,
    getRecordName: (row) => row.studentCode,
    permissions: { canDelete, canRestore, canManage },
    showFeedback,
    isSocketConnected,
    getLogMetadata: (row) => ({ studentId: row.id, studentCode: row.studentCode }),
  })

  const { handleToggleStatus, togglingIds: togglingStudents } = useToggleStatus<StudentRow>({
    resourceName: "students",
    updateRoute: (id) => apiRoutes.students.update(id),
    queryKeys: {
      all: () => queryKeys.adminStudents.all(),
      detail: (id) => queryKeys.adminStudents.detail(id),
    },
    messages: STUDENT_MESSAGES,
    getRecordName: (row) => row.studentCode,
    canManage: canActivate,
    showFeedback,
    onSuccess: async (row, newStatus) => {
      resourceLogger.tableAction({
        resource: "students",
        action: newStatus ? "restore" : "delete",
        studentId: row.id,
        studentCode: row.studentCode,
      })
    },
  })

  return {
    handleToggleStatus,
    executeSingleAction,
    executeBulkAction,
    togglingStudents,
    deletingStudents,
    restoringStudents,
    hardDeletingStudents,
    bulkState,
  }
}
