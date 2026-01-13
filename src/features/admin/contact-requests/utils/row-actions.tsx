import { useCallback } from "react"
import { useResourceRouter } from "@/hooks"
import { RotateCcw, Trash2, AlertTriangle, Eye, Pencil, Check, X } from "lucide-react"
import { renderRowActions, type RowActionConfig } from "@/features/admin/resources/utils/render-row-actions"
import type { ContactRequestRow } from "../types"
import { CONTACT_REQUEST_LABELS } from "../constants"

interface UseContactRequestRowActionsOptions {
  canDelete: boolean
  canRestore: boolean
  canManage: boolean
  canUpdate?: boolean
  onToggleRead: (row: ContactRequestRow, checked: boolean) => void
  onDelete: (row: ContactRequestRow) => void
  onHardDelete: (row: ContactRequestRow) => void
  onRestore: (row: ContactRequestRow) => void
  markingReadIds?: Set<string>
  markingUnreadIds?: Set<string>
  deletingIds?: Set<string>
  restoringIds?: Set<string>
  hardDeletingIds?: Set<string>
}

export const useContactRequestRowActions = ({
  canDelete,
  canRestore,
  canManage,
  canUpdate = false,
  onToggleRead,
  onDelete,
  onHardDelete,
  onRestore,
  markingReadIds = new Set(),
  markingUnreadIds = new Set(),
  deletingIds = new Set(),
  restoringIds = new Set(),
  hardDeletingIds = new Set(),
}: UseContactRequestRowActionsOptions) => {
  const router = useResourceRouter()

  const renderActiveRowActions = useCallback(
    (row: ContactRequestRow) => {
      const actions: RowActionConfig[] = [
        {
          label: CONTACT_REQUEST_LABELS.VIEW_DETAIL,
          icon: Eye,
          onSelect: () => router.push(`/admin/contact-requests/${row.id}`),
        },
      ]

      if (canUpdate) {
        actions.push({
          label: CONTACT_REQUEST_LABELS.EDIT,
          icon: Pencil,
          onSelect: () => router.push(`/admin/contact-requests/${row.id}/edit`),
        })
      }

      if (canUpdate) {
        if (row.isRead) {
          const isMarkingUnread = markingUnreadIds.has(row.id)
          actions.push({
            label: CONTACT_REQUEST_LABELS.MARK_UNREAD,
            icon: X,
            onSelect: () => onToggleRead(row, false),
            disabled: isMarkingUnread || markingReadIds.has(row.id) || deletingIds.has(row.id) || restoringIds.has(row.id) || hardDeletingIds.has(row.id),
            isLoading: isMarkingUnread,
            loadingLabel: CONTACT_REQUEST_LABELS.MARKING_UNREAD,
          })
        } else {
          const isMarkingRead = markingReadIds.has(row.id)
          actions.push({
            label: CONTACT_REQUEST_LABELS.MARK_READ,
            icon: Check,
            onSelect: () => onToggleRead(row, true),
            disabled: isMarkingRead || markingUnreadIds.has(row.id) || deletingIds.has(row.id) || restoringIds.has(row.id) || hardDeletingIds.has(row.id),
            isLoading: isMarkingRead,
            loadingLabel: CONTACT_REQUEST_LABELS.MARKING_READ,
          })
        }
      }

      if (canDelete) {
        const isDeleting = deletingIds.has(row.id)
        actions.push({
          label: CONTACT_REQUEST_LABELS.DELETE,
          icon: Trash2,
          onSelect: () => onDelete(row),
          destructive: true,
          disabled: isDeleting || markingReadIds.has(row.id) || markingUnreadIds.has(row.id) || restoringIds.has(row.id) || hardDeletingIds.has(row.id),
          isLoading: isDeleting,
          loadingLabel: CONTACT_REQUEST_LABELS.DELETING,
        })
      }

      if (canManage) {
        const isHardDeleting = hardDeletingIds.has(row.id)
        actions.push({
          label: CONTACT_REQUEST_LABELS.HARD_DELETE,
          icon: AlertTriangle,
          onSelect: () => onHardDelete(row),
          destructive: true,
          disabled: deletingIds.has(row.id) || markingReadIds.has(row.id) || markingUnreadIds.has(row.id) || restoringIds.has(row.id) || isHardDeleting,
          isLoading: isHardDeleting,
          loadingLabel: CONTACT_REQUEST_LABELS.HARD_DELETING,
        })
      }

      return renderRowActions(actions)
    },
    [canDelete, canManage, canUpdate, onDelete, onHardDelete, onToggleRead, router, markingReadIds, markingUnreadIds, deletingIds, restoringIds, hardDeletingIds],
  )

  const renderDeletedRowActions = useCallback(
    (row: ContactRequestRow) => {
      const actions: RowActionConfig[] = [
        {
          label: CONTACT_REQUEST_LABELS.VIEW_DETAIL,
          icon: Eye,
          onSelect: () => router.push(`/admin/contact-requests/${row.id}`),
        },
      ]

      if (canRestore) {
        const isRestoring = restoringIds.has(row.id)
        actions.push({
          label: CONTACT_REQUEST_LABELS.RESTORE,
          icon: RotateCcw,
          onSelect: () => onRestore(row),
          disabled: deletingIds.has(row.id) || isRestoring || hardDeletingIds.has(row.id),
          isLoading: isRestoring,
          loadingLabel: CONTACT_REQUEST_LABELS.RESTORING,
        })
      }

      if (canManage) {
        const isHardDeleting = hardDeletingIds.has(row.id)
        actions.push({
          label: CONTACT_REQUEST_LABELS.HARD_DELETE,
          icon: AlertTriangle,
          onSelect: () => onHardDelete(row),
          destructive: true,
          disabled: deletingIds.has(row.id) || restoringIds.has(row.id) || isHardDeleting,
          isLoading: isHardDeleting,
          loadingLabel: CONTACT_REQUEST_LABELS.HARD_DELETING,
        })
      }

      return renderRowActions(actions)
    },
    [canManage, canRestore, onHardDelete, onRestore, router, deletingIds, restoringIds, hardDeletingIds],
  )

  return {
    renderActiveRowActions,
    renderDeletedRowActions,
  }
}

