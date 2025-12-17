import { useCallback } from "react"
import { useResourceRouter } from "@/hooks/use-resource-segment"
import { RotateCcw, Trash2, AlertTriangle, Eye, Check, X } from "lucide-react"
import { renderRowActions, type RowActionConfig } from "@/features/admin/resources/utils/render-row-actions"
import type { CommentRow } from "../types"
import { COMMENT_LABELS } from "../constants"

interface UseRowActionsOptions {
  canApprove: boolean
  canDelete: boolean
  canRestore: boolean
  canManage: boolean
  onToggleApprove: (row: CommentRow, checked: boolean) => void
  onDelete: (row: CommentRow) => void
  onHardDelete: (row: CommentRow) => void
  onRestore: (row: CommentRow) => void
  approvingComments?: Set<string>
  unapprovingComments?: Set<string>
  deletingComments?: Set<string>
  restoringComments?: Set<string>
  hardDeletingComments?: Set<string>
}

export const useCommentRowActions = ({
  canApprove,
  canDelete,
  canRestore,
  canManage,
  onToggleApprove,
  onDelete,
  onHardDelete,
  onRestore,
  approvingComments = new Set(),
  unapprovingComments = new Set(),
  deletingComments = new Set(),
  restoringComments = new Set(),
  hardDeletingComments = new Set(),
}: UseRowActionsOptions) => {
  const router = useResourceRouter()

  const renderActiveRowActions = useCallback(
    (row: CommentRow) => {
      const actions: RowActionConfig[] = [
        {
          label: COMMENT_LABELS.VIEW_DETAIL,
          icon: Eye,
          onSelect: () => router.push(`/admin/comments/${row.id}`),
        },
      ]

      if (canApprove) {
        if (row.approved) {
          const isUnapproving = unapprovingComments.has(row.id)
          actions.push({
            label: COMMENT_LABELS.UNAPPROVE,
            icon: X,
            onSelect: () => onToggleApprove(row, false),
            disabled: isUnapproving || approvingComments.has(row.id) || deletingComments.has(row.id) || restoringComments.has(row.id) || hardDeletingComments.has(row.id),
            isLoading: isUnapproving,
            loadingLabel: COMMENT_LABELS.UNAPPROVING,
          })
        } else {
          const isApproving = approvingComments.has(row.id)
          actions.push({
            label: COMMENT_LABELS.APPROVE,
            icon: Check,
            onSelect: () => onToggleApprove(row, true),
            disabled: isApproving || unapprovingComments.has(row.id) || deletingComments.has(row.id) || restoringComments.has(row.id) || hardDeletingComments.has(row.id),
            isLoading: isApproving,
            loadingLabel: COMMENT_LABELS.APPROVING,
          })
        }
      }

      if (canDelete) {
        const isDeleting = deletingComments.has(row.id)
        actions.push({
          label: COMMENT_LABELS.DELETE,
          icon: Trash2,
          onSelect: () => onDelete(row),
          destructive: true,
          disabled: isDeleting || restoringComments.has(row.id) || hardDeletingComments.has(row.id),
          isLoading: isDeleting,
          loadingLabel: COMMENT_LABELS.DELETING,
        })
      }

      if (canManage) {
        const isHardDeleting = hardDeletingComments.has(row.id)
        actions.push({
          label: COMMENT_LABELS.HARD_DELETE,
          icon: AlertTriangle,
          onSelect: () => onHardDelete(row),
          destructive: true,
          disabled: deletingComments.has(row.id) || restoringComments.has(row.id) || isHardDeleting,
          isLoading: isHardDeleting,
          loadingLabel: COMMENT_LABELS.HARD_DELETING,
        })
      }

      return renderRowActions(actions)
    },
    [canApprove, canDelete, canManage, onToggleApprove, onDelete, onHardDelete, router, approvingComments, unapprovingComments, deletingComments, restoringComments, hardDeletingComments],
  )

  const renderDeletedRowActions = useCallback(
    (row: CommentRow) => {
      const actions: RowActionConfig[] = [
        {
          label: COMMENT_LABELS.VIEW_DETAIL,
          icon: Eye,
          onSelect: () => router.push(`/admin/comments/${row.id}`),
        },
      ]

      if (canRestore) {
        const isRestoring = restoringComments.has(row.id)
        actions.push({
          label: COMMENT_LABELS.RESTORE,
          icon: RotateCcw,
          onSelect: () => onRestore(row),
          disabled: deletingComments.has(row.id) || isRestoring || hardDeletingComments.has(row.id),
          isLoading: isRestoring,
          loadingLabel: COMMENT_LABELS.RESTORING,
        })
      }

      if (canManage) {
        const isHardDeleting = hardDeletingComments.has(row.id)
        actions.push({
          label: COMMENT_LABELS.HARD_DELETE,
          icon: AlertTriangle,
          onSelect: () => onHardDelete(row),
          destructive: true,
          disabled: deletingComments.has(row.id) || restoringComments.has(row.id) || isHardDeleting,
          isLoading: isHardDeleting,
          loadingLabel: COMMENT_LABELS.HARD_DELETING,
        })
      }

      return renderRowActions(actions)
    },
    [canManage, canRestore, onHardDelete, onRestore, router, deletingComments, restoringComments, hardDeletingComments],
  )

  return {
    renderActiveRowActions,
    renderDeletedRowActions,
  }
}

