import { useCallback } from "react"
import { useResourceRouter } from "@/hooks/use-resource-segment"
import { RotateCcw, Trash2, AlertTriangle, Eye, CheckCircle2, XCircle } from "lucide-react"
import { renderRowActions, type RowActionConfig } from "@/features/admin/resources/utils/render-row-actions"
import type { SessionRow } from "../types"
import { SESSION_LABELS } from "../constants"

interface UseSessionRowActionsOptions {
  canDelete: boolean
  canRestore: boolean
  canManage: boolean
  onToggleStatus?: (row: SessionRow, checked: boolean) => void
  onDelete: (row: SessionRow) => void
  onHardDelete: (row: SessionRow) => void
  onRestore: (row: SessionRow) => void
  togglingSessions?: Set<string>
  deletingSessions?: Set<string>
  restoringSessions?: Set<string>
  hardDeletingSessions?: Set<string>
}

export const useSessionRowActions = ({
  canDelete,
  canRestore,
  canManage,
  onToggleStatus,
  onDelete,
  onHardDelete,
  onRestore,
  togglingSessions = new Set(),
  deletingSessions = new Set(),
  restoringSessions = new Set(),
  hardDeletingSessions = new Set(),
}: UseSessionRowActionsOptions) => {
  const router = useResourceRouter()

  const renderActiveRowActions = useCallback(
    (row: SessionRow) => {
      const actions: RowActionConfig[] = [
        {
          label: SESSION_LABELS.VIEW_DETAIL,
          icon: Eye,
          onSelect: () => router.push(`/admin/sessions/${row.id}`),
        },
      ]

      if (canManage && onToggleStatus) {
        if (row.isActive) {
          const isToggling = togglingSessions.has(row.id)
          actions.push({
            label: SESSION_LABELS.TOGGLE_INACTIVE,
            icon: XCircle,
            onSelect: () => onToggleStatus(row, false),
            disabled: isToggling || deletingSessions.has(row.id) || restoringSessions.has(row.id) || hardDeletingSessions.has(row.id),
            isLoading: isToggling,
            loadingLabel: SESSION_LABELS.TOGGLING,
          })
        } else {
          const isToggling = togglingSessions.has(row.id)
          actions.push({
            label: SESSION_LABELS.TOGGLE_ACTIVE,
            icon: CheckCircle2,
            onSelect: () => onToggleStatus(row, true),
            disabled: isToggling || deletingSessions.has(row.id) || restoringSessions.has(row.id) || hardDeletingSessions.has(row.id),
            isLoading: isToggling,
            loadingLabel: SESSION_LABELS.TOGGLING,
          })
        }
      }

      if (canDelete) {
        const isDeleting = deletingSessions.has(row.id)
        actions.push({
          label: SESSION_LABELS.DELETE,
          icon: Trash2,
          onSelect: () => onDelete(row),
          destructive: true,
          disabled: isDeleting || togglingSessions.has(row.id) || restoringSessions.has(row.id) || hardDeletingSessions.has(row.id),
          isLoading: isDeleting,
          loadingLabel: SESSION_LABELS.DELETING,
        })
      }

      if (canManage) {
        const isHardDeleting = hardDeletingSessions.has(row.id)
        actions.push({
          label: SESSION_LABELS.HARD_DELETE,
          icon: AlertTriangle,
          onSelect: () => onHardDelete(row),
          destructive: true,
          disabled: deletingSessions.has(row.id) || togglingSessions.has(row.id) || restoringSessions.has(row.id) || isHardDeleting,
          isLoading: isHardDeleting,
          loadingLabel: SESSION_LABELS.HARD_DELETING,
        })
      }

      return renderRowActions(actions)
    },
    [canDelete, canManage, onToggleStatus, onDelete, onHardDelete, router, togglingSessions, deletingSessions, restoringSessions, hardDeletingSessions],
  )

  const renderDeletedRowActions = useCallback(
    (row: SessionRow) => {
      const actions: RowActionConfig[] = [
        {
          label: SESSION_LABELS.VIEW_DETAIL,
          icon: Eye,
          onSelect: () => router.push(`/admin/sessions/${row.id}`),
        },
      ]

      if (canRestore) {
        const isRestoring = restoringSessions.has(row.id)
        actions.push({
          label: SESSION_LABELS.RESTORE,
          icon: RotateCcw,
          onSelect: () => onRestore(row),
          disabled: deletingSessions.has(row.id) || togglingSessions.has(row.id) || isRestoring || hardDeletingSessions.has(row.id),
          isLoading: isRestoring,
          loadingLabel: SESSION_LABELS.RESTORING,
        })
      }

      if (canManage) {
        const isHardDeleting = hardDeletingSessions.has(row.id)
        actions.push({
          label: SESSION_LABELS.HARD_DELETE,
          icon: AlertTriangle,
          onSelect: () => onHardDelete(row),
          destructive: true,
          disabled: deletingSessions.has(row.id) || togglingSessions.has(row.id) || restoringSessions.has(row.id) || isHardDeleting,
          isLoading: isHardDeleting,
          loadingLabel: SESSION_LABELS.HARD_DELETING,
        })
      }

      return renderRowActions(actions)
    },
    [canManage, canRestore, onHardDelete, onRestore, router, togglingSessions, deletingSessions, restoringSessions, hardDeletingSessions],
  )

  return {
    renderActiveRowActions,
    renderDeletedRowActions,
  }
}

