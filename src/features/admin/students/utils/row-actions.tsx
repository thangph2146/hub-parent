import { useCallback } from "react"
import { useResourceRouter } from "@/hooks"
import { RotateCcw, Trash2, AlertTriangle, Eye, Pencil } from "lucide-react"
import { renderRowActions, type RowActionConfig } from "@/features/admin/resources/utils/render-row-actions"
import type { StudentRow } from "../types"
import { STUDENT_LABELS } from "../constants/messages"

interface UseStudentRowActionsOptions {
  canDelete: boolean
  canRestore: boolean
  canManage: boolean
  canUpdate?: boolean
  onDelete: (row: StudentRow) => void
  onHardDelete: (row: StudentRow) => void
  onRestore: (row: StudentRow) => void
  deletingStudents?: Set<string>
  restoringStudents?: Set<string>
  hardDeletingStudents?: Set<string>
}

export const useStudentRowActions = ({
  canDelete,
  canRestore,
  canManage,
  canUpdate = false,
  onDelete,
  onHardDelete,
  onRestore,
  deletingStudents = new Set(),
  restoringStudents = new Set(),
  hardDeletingStudents = new Set(),
}: UseStudentRowActionsOptions) => {
  const router = useResourceRouter()

  const renderActiveRowActions = useCallback(
    (row: StudentRow) => {
      const actions: RowActionConfig[] = [
        {
          label: STUDENT_LABELS.VIEW_DETAIL,
          icon: Eye,
          onSelect: () => router.push(`/admin/students/${row.id}`),
        },
      ]

      if (canUpdate) {
        actions.push({
          label: STUDENT_LABELS.EDIT,
          icon: Pencil,
          onSelect: () => router.push(`/admin/students/${row.id}/edit`),
        })
      }

      if (canDelete) {
        const isDeleting = deletingStudents.has(row.id)
        actions.push({
          label: STUDENT_LABELS.DELETE,
          icon: Trash2,
          onSelect: () => onDelete(row),
          destructive: true,
          disabled: isDeleting || restoringStudents.has(row.id) || hardDeletingStudents.has(row.id),
          isLoading: isDeleting,
          loadingLabel: STUDENT_LABELS.DELETING,
        })
      }

      if (canManage) {
        const isHardDeleting = hardDeletingStudents.has(row.id)
        actions.push({
          label: STUDENT_LABELS.HARD_DELETE,
          icon: AlertTriangle,
          onSelect: () => onHardDelete(row),
          destructive: true,
          disabled: deletingStudents.has(row.id) || restoringStudents.has(row.id) || isHardDeleting,
          isLoading: isHardDeleting,
          loadingLabel: STUDENT_LABELS.HARD_DELETING,
        })
      }

      return renderRowActions(actions)
    },
    [canDelete, canManage, canUpdate, onDelete, onHardDelete, router, deletingStudents, restoringStudents, hardDeletingStudents],
  )

  const renderDeletedRowActions = useCallback(
    (row: StudentRow) => {
      const actions: RowActionConfig[] = [
        {
          label: STUDENT_LABELS.VIEW_DETAIL,
          icon: Eye,
          onSelect: () => router.push(`/admin/students/${row.id}`),
        },
      ]

      if (canRestore) {
        const isRestoring = restoringStudents.has(row.id)
        actions.push({
          label: STUDENT_LABELS.RESTORE,
          icon: RotateCcw,
          onSelect: () => onRestore(row),
          disabled: deletingStudents.has(row.id) || isRestoring || hardDeletingStudents.has(row.id),
          isLoading: isRestoring,
          loadingLabel: STUDENT_LABELS.RESTORING,
        })
      }

      if (canManage) {
        const isHardDeleting = hardDeletingStudents.has(row.id)
        actions.push({
          label: STUDENT_LABELS.HARD_DELETE,
          icon: AlertTriangle,
          onSelect: () => onHardDelete(row),
          destructive: true,
          disabled: deletingStudents.has(row.id) || restoringStudents.has(row.id) || isHardDeleting,
          isLoading: isHardDeleting,
          loadingLabel: STUDENT_LABELS.HARD_DELETING,
        })
      }

      return renderRowActions(actions)
    },
    [canManage, canRestore, onHardDelete, onRestore, router, deletingStudents, restoringStudents, hardDeletingStudents],
  )

  return {
    renderActiveRowActions,
    renderDeletedRowActions,
  }
}

