import { useCallback } from "react"
import { useResourceRouter } from "@/hooks"
import { RotateCcw, Trash2, AlertTriangle, Eye, Pencil } from "lucide-react"
import { renderRowActions, type RowActionConfig } from "@/features/admin/resources/utils/render-row-actions"
import type { UserRow } from "../types"
import { USER_LABELS, PROTECTED_SUPER_ADMIN_EMAIL } from "../constants"

interface UseRowActionsOptions {
  canDelete: boolean
  canRestore: boolean
  canManage: boolean
  onDelete: (row: UserRow) => void
  onHardDelete: (row: UserRow) => void
  onRestore: (row: UserRow) => void
  deletingUsers?: Set<string>
  restoringUsers?: Set<string>
  hardDeletingUsers?: Set<string>
}

export const useUserRowActions = ({
  canDelete,
  canRestore,
  canManage,
  onDelete,
  onHardDelete,
  onRestore,
  deletingUsers = new Set(),
  restoringUsers = new Set(),
  hardDeletingUsers = new Set(),
}: UseRowActionsOptions) => {
  const router = useResourceRouter()

  const renderActiveRowActions = useCallback(
    (row: UserRow) => {
      const actions: RowActionConfig[] = [
        {
          label: USER_LABELS.VIEW_DETAIL,
          icon: Eye,
          onSelect: () => {
            // Logging được xử lý bởi useResourceRouter
            router.push(`/admin/users/${row.id}`)
          },
        },
      ]

      if (canManage) {
        actions.push({
          label: USER_LABELS.EDIT,
          icon: Pencil,
          onSelect: () => {
            // Logging được xử lý bởi useResourceRouter
            router.push(`/admin/users/${row.id}/edit`)
          },
        })
      }

      if (canDelete) {
        const isDeleting = deletingUsers.has(row.id)
        const isSuperAdmin = row.email === PROTECTED_SUPER_ADMIN_EMAIL
        actions.push({
          label: USER_LABELS.DELETE,
          icon: Trash2,
          onSelect: () => onDelete(row),
          destructive: true,
          disabled: isDeleting || restoringUsers.has(row.id) || hardDeletingUsers.has(row.id) || isSuperAdmin,
          isLoading: isDeleting,
          loadingLabel: USER_LABELS.DELETING,
        })
      }

      if (canManage) {
        const isHardDeleting = hardDeletingUsers.has(row.id)
        const isSuperAdmin = row.email === PROTECTED_SUPER_ADMIN_EMAIL
        actions.push({
          label: USER_LABELS.HARD_DELETE,
          icon: AlertTriangle,
          onSelect: () => onHardDelete(row),
          destructive: true,
          disabled: deletingUsers.has(row.id) || restoringUsers.has(row.id) || isHardDeleting || isSuperAdmin,
          isLoading: isHardDeleting,
          loadingLabel: USER_LABELS.HARD_DELETING,
        })
      }

      return renderRowActions(actions)
    },
    [canDelete, canManage, onDelete, onHardDelete, router, deletingUsers, restoringUsers, hardDeletingUsers],
  )

  const renderDeletedRowActions = useCallback(
    (row: UserRow) => {
      const actions: RowActionConfig[] = [
        {
          label: USER_LABELS.VIEW_DETAIL,
          icon: Eye,
          onSelect: () => {
            // Logging được xử lý bởi useResourceRouter
            router.push(`/admin/users/${row.id}`)
          },
        },
      ]

      if (canRestore) {
        const isRestoring = restoringUsers.has(row.id)
        actions.push({
          label: USER_LABELS.RESTORE,
          icon: RotateCcw,
          onSelect: () => onRestore(row),
          disabled: deletingUsers.has(row.id) || isRestoring || hardDeletingUsers.has(row.id),
          isLoading: isRestoring,
          loadingLabel: USER_LABELS.RESTORING,
        })
      }

      if (canManage) {
        const isHardDeleting = hardDeletingUsers.has(row.id)
        const isSuperAdmin = row.email === PROTECTED_SUPER_ADMIN_EMAIL
        actions.push({
          label: USER_LABELS.HARD_DELETE,
          icon: AlertTriangle,
          onSelect: () => onHardDelete(row),
          destructive: true,
          disabled: deletingUsers.has(row.id) || restoringUsers.has(row.id) || isHardDeleting || isSuperAdmin,
          isLoading: isHardDeleting,
          loadingLabel: USER_LABELS.HARD_DELETING,
        })
      }

      return renderRowActions(actions)
    },
    [canManage, canRestore, onHardDelete, onRestore, router, deletingUsers, restoringUsers, hardDeletingUsers],
  )

  return {
    renderActiveRowActions,
    renderDeletedRowActions,
  }
}

