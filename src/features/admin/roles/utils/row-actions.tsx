import { useCallback } from "react"
import { useResourceRouter } from "@/hooks"
import { RotateCcw, Trash2, AlertTriangle, Eye, Pencil } from "lucide-react"
import { renderRowActions, type RowActionConfig } from "@/features/admin/resources/utils/render-row-actions"
import type { RoleRow } from "../types"
import { ROLE_LABELS } from "../constants/messages"

interface UseRowActionsOptions {
  canDelete: boolean
  canRestore: boolean
  canManage: boolean
  onDelete: (row: RoleRow) => void
  onHardDelete: (row: RoleRow) => void
  onRestore: (row: RoleRow) => void
  deletingRoles?: Set<string>
  restoringRoles?: Set<string>
  hardDeletingRoles?: Set<string>
}

export const useRoleRowActions = ({
  canDelete,
  canRestore,
  canManage,
  onDelete,
  onHardDelete,
  onRestore,
  deletingRoles = new Set(),
  restoringRoles = new Set(),
  hardDeletingRoles = new Set(),
}: UseRowActionsOptions) => {
  const router = useResourceRouter()

  const renderActiveRowActions = useCallback(
    (row: RoleRow) => {
      const actions: RowActionConfig[] = [
        {
          label: ROLE_LABELS.VIEW_DETAIL,
          icon: Eye,
          onSelect: () => router.push(`/admin/roles/${row.id}`),
        },
      ]

      if (canManage) {
        actions.push({
          label: ROLE_LABELS.EDIT,
          icon: Pencil,
          onSelect: () => router.push(`/admin/roles/${row.id}/edit`),
        })
      }

      if (canDelete) {
        const isDeleting = deletingRoles.has(row.id)
        actions.push({
          label: ROLE_LABELS.DELETE,
          icon: Trash2,
          onSelect: () => onDelete(row),
          destructive: true,
          disabled: row.name === "super_admin" || isDeleting || restoringRoles.has(row.id) || hardDeletingRoles.has(row.id),
          isLoading: isDeleting,
          loadingLabel: ROLE_LABELS.DELETING,
        })
      }

      if (canManage) {
        const isHardDeleting = hardDeletingRoles.has(row.id)
        actions.push({
          label: ROLE_LABELS.HARD_DELETE,
          icon: AlertTriangle,
          onSelect: () => onHardDelete(row),
          destructive: true,
          disabled: row.name === "super_admin" || deletingRoles.has(row.id) || restoringRoles.has(row.id) || isHardDeleting,
          isLoading: isHardDeleting,
          loadingLabel: ROLE_LABELS.HARD_DELETING,
        })
      }

      return renderRowActions(actions)
    },
    [canDelete, canManage, onDelete, onHardDelete, router, deletingRoles, restoringRoles, hardDeletingRoles],
  )

  const renderDeletedRowActions = useCallback(
    (row: RoleRow) => {
      const actions: RowActionConfig[] = [
        {
          label: ROLE_LABELS.VIEW_DETAIL,
          icon: Eye,
          onSelect: () => router.push(`/admin/roles/${row.id}`),
        },
      ]

      if (canRestore) {
        const isRestoring = restoringRoles.has(row.id)
        actions.push({
          label: ROLE_LABELS.RESTORE,
          icon: RotateCcw,
          onSelect: () => onRestore(row),
          disabled: deletingRoles.has(row.id) || isRestoring || hardDeletingRoles.has(row.id),
          isLoading: isRestoring,
          loadingLabel: ROLE_LABELS.RESTORING,
        })
      }

      if (canManage) {
        const isHardDeleting = hardDeletingRoles.has(row.id)
        actions.push({
          label: ROLE_LABELS.HARD_DELETE,
          icon: AlertTriangle,
          onSelect: () => onHardDelete(row),
          destructive: true,
          disabled: row.name === "super_admin" || deletingRoles.has(row.id) || restoringRoles.has(row.id) || isHardDeleting,
          isLoading: isHardDeleting,
          loadingLabel: ROLE_LABELS.HARD_DELETING,
        })
      }

      return renderRowActions(actions)
    },
    [canManage, canRestore, onHardDelete, onRestore, router, deletingRoles, restoringRoles, hardDeletingRoles],
  )

  return {
    renderActiveRowActions,
    renderDeletedRowActions,
  }
}

