import { useCallback } from "react"
import { useResourceNavigation } from "@/features/admin/resources/hooks"
import { RotateCcw, Trash2, AlertTriangle, Eye, Pencil } from "lucide-react"
import { renderRowActions, type RowActionConfig } from "@/features/admin/resources/utils/render-row-actions"
import type { PostRow } from "../types"
import { POST_LABELS } from "../constants/messages"

interface UseRowActionsOptions {
  canDelete: boolean
  canRestore: boolean
  canManage: boolean
  onDelete: (row: PostRow) => void
  onHardDelete: (row: PostRow) => void
  onRestore: (row: PostRow) => void
  deletingIds?: Set<string>
  restoringIds?: Set<string>
  hardDeletingIds?: Set<string>
}

export const usePostRowActions = ({
  canDelete,
  canRestore,
  canManage,
  onDelete,
  onHardDelete,
  onRestore,
  deletingIds = new Set(),
  restoringIds = new Set(),
  hardDeletingIds = new Set(),
}: UseRowActionsOptions) => {
  const { navigate } = useResourceNavigation()

  const renderActiveRowActions = useCallback(
    (row: PostRow) => {
      const actions: RowActionConfig[] = [
        {
          label: POST_LABELS.VIEW_DETAIL,
          icon: Eye,
          onSelect: () => navigate(`/admin/posts/${row.id}`),
        },
      ]

      if (canManage) {
        actions.push({
          label: POST_LABELS.EDIT,
          icon: Pencil,
          onSelect: () => navigate(`/admin/posts/${row.id}/edit`),
        })
      }

      if (canDelete) {
        const isDeleting = deletingIds.has(row.id)
        actions.push({
          label: POST_LABELS.DELETE,
          icon: Trash2,
          onSelect: () => onDelete(row),
          destructive: true,
          disabled: isDeleting || restoringIds.has(row.id) || hardDeletingIds.has(row.id),
          isLoading: isDeleting,
          loadingLabel: POST_LABELS.DELETING,
        })
      }

      if (canManage) {
        const isHardDeleting = hardDeletingIds.has(row.id)
        actions.push({
          label: POST_LABELS.HARD_DELETE,
          icon: AlertTriangle,
          onSelect: () => onHardDelete(row),
          destructive: true,
          disabled: deletingIds.has(row.id) || restoringIds.has(row.id) || isHardDeleting,
          isLoading: isHardDeleting,
          loadingLabel: POST_LABELS.HARD_DELETING,
        })
      }

      return renderRowActions(actions)
    },
    [canDelete, canManage, onDelete, onHardDelete, navigate, deletingIds, restoringIds, hardDeletingIds],
  )

  const renderDeletedRowActions = useCallback(
    (row: PostRow) => {
      const actions: RowActionConfig[] = [
        {
          label: POST_LABELS.VIEW_DETAIL,
          icon: Eye,
          onSelect: () => navigate(`/admin/posts/${row.id}`),
        },
      ]

      if (canRestore) {
        const isRestoring = restoringIds.has(row.id)
        actions.push({
          label: POST_LABELS.RESTORE,
          icon: RotateCcw,
          onSelect: () => onRestore(row),
          disabled: deletingIds.has(row.id) || isRestoring || hardDeletingIds.has(row.id),
          isLoading: isRestoring,
          loadingLabel: POST_LABELS.RESTORING,
        })
      }

      if (canManage) {
        const isHardDeleting = hardDeletingIds.has(row.id)
        actions.push({
          label: POST_LABELS.HARD_DELETE,
          icon: AlertTriangle,
          onSelect: () => onHardDelete(row),
          destructive: true,
          disabled: deletingIds.has(row.id) || restoringIds.has(row.id) || isHardDeleting,
          isLoading: isHardDeleting,
          loadingLabel: POST_LABELS.HARD_DELETING,
        })
      }

      return renderRowActions(actions)
    },
    [canManage, canRestore, onHardDelete, onRestore, navigate, deletingIds, restoringIds, hardDeletingIds],
  )

  return {
    renderActiveRowActions,
    renderDeletedRowActions,
  }
}

