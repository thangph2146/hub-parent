import { useCallback, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/lib/api/axios"
import { apiRoutes } from "@/lib/api/routes"
import { queryKeys } from "@/lib/query-keys"
import { useResourceActions } from "@/features/admin/resources/hooks"
import { getErrorMessage, invalidateAndRefetchQueries } from "@/lib/utils"
import type { ResourceRefreshHandler } from "@/features/admin/resources/types"
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
  const queryClient = useQueryClient()
  const [togglingStudents, setTogglingStudents] = useState<Set<string>>(new Set())

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
    permissions: {
      canDelete,
      canRestore,
      canManage,
    },
    showFeedback,
    isSocketConnected,
    getLogMetadata: (row) => ({
      studentId: row.id,
      studentCode: row.studentCode,
    }),
  })

  const handleToggleStatus = useCallback(
    async (row: StudentRow, newStatus: boolean, _refresh: ResourceRefreshHandler) => {
      if (!canActivate) {
        showFeedback("error", STUDENT_MESSAGES.NO_PERMISSION, STUDENT_MESSAGES.NO_ACTIVE_PERMISSION)
        return
      }

      resourceLogger.tableAction({
        resource: "students",
        action: newStatus ? "restore" : "delete",
        studentId: row.id,
        studentCode: row.studentCode,
      })

      setTogglingStudents((prev) => new Set(prev).add(row.id))

      try {
        await apiClient.put(apiRoutes.students.update(row.id), {
          isActive: newStatus,
        })

        showFeedback(
          "success",
          STUDENT_MESSAGES.TOGGLE_ACTIVE_SUCCESS,
          `Đã ${newStatus ? "kích hoạt" : "vô hiệu hóa"} sinh viên ${row.studentCode}`
        )
        
        // Invalidate và refetch list queries - sử dụng "all" để đảm bảo refetch tất cả queries
        await invalidateAndRefetchQueries(queryClient, queryKeys.adminStudents.all())
        
        // Invalidate và refetch detail query
        await invalidateAndRefetchQueries(queryClient, queryKeys.adminStudents.detail(row.id))
        
        // Gọi refresh callback để cập nhật UI ngay lập tức
        await _refresh()
      } catch (error: unknown) {
        const errorMessage = getErrorMessage(error) || STUDENT_MESSAGES.UNKNOWN_ERROR
        showFeedback(
          "error",
          STUDENT_MESSAGES.TOGGLE_ACTIVE_ERROR,
          `Không thể ${newStatus ? "kích hoạt" : "vô hiệu hóa"} sinh viên`,
          errorMessage
        )
      } finally {
        setTogglingStudents((prev) => {
          const next = new Set(prev)
          next.delete(row.id)
          return next
        })
      }
    },
    [canActivate, showFeedback, queryClient],
  )

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
