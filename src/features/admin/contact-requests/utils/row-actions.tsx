import { useCallback } from "react"
import { useResourceRouter } from "@/hooks/use-resource-segment"
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
  markingReadRequests?: Set<string>
  markingUnreadRequests?: Set<string>
  deletingRequests?: Set<string>
  restoringRequests?: Set<string>
  hardDeletingRequests?: Set<string>
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
  markingReadRequests = new Set(),
  markingUnreadRequests = new Set(),
  deletingRequests = new Set(),
  restoringRequests = new Set(),
  hardDeletingRequests = new Set(),
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
          const isMarkingUnread = markingUnreadRequests.has(row.id)
          actions.push({
            label: CONTACT_REQUEST_LABELS.MARK_UNREAD,
            icon: X,
            onSelect: () => onToggleRead(row, false),
            disabled: isMarkingUnread || markingReadRequests.has(row.id) || deletingRequests.has(row.id) || restoringRequests.has(row.id) || hardDeletingRequests.has(row.id),
            isLoading: isMarkingUnread,
            loadingLabel: CONTACT_REQUEST_LABELS.MARKING_UNREAD,
          })
        } else {
          const isMarkingRead = markingReadRequests.has(row.id)
          actions.push({
            label: CONTACT_REQUEST_LABELS.MARK_READ,
            icon: Check,
            onSelect: () => onToggleRead(row, true),
            disabled: isMarkingRead || markingUnreadRequests.has(row.id) || deletingRequests.has(row.id) || restoringRequests.has(row.id) || hardDeletingRequests.has(row.id),
            isLoading: isMarkingRead,
            loadingLabel: CONTACT_REQUEST_LABELS.MARKING_READ,
          })
        }
      }

      if (canDelete) {
        const isDeleting = deletingRequests.has(row.id)
        actions.push({
          label: CONTACT_REQUEST_LABELS.DELETE,
          icon: Trash2,
          onSelect: () => onDelete(row),
          destructive: true,
          disabled: isDeleting || markingReadRequests.has(row.id) || markingUnreadRequests.has(row.id) || restoringRequests.has(row.id) || hardDeletingRequests.has(row.id),
          isLoading: isDeleting,
          loadingLabel: CONTACT_REQUEST_LABELS.DELETING,
        })
      }

      if (canManage) {
        const isHardDeleting = hardDeletingRequests.has(row.id)
        actions.push({
          label: CONTACT_REQUEST_LABELS.HARD_DELETE,
          icon: AlertTriangle,
          onSelect: () => onHardDelete(row),
          destructive: true,
          disabled: deletingRequests.has(row.id) || markingReadRequests.has(row.id) || markingUnreadRequests.has(row.id) || restoringRequests.has(row.id) || isHardDeleting,
          isLoading: isHardDeleting,
          loadingLabel: CONTACT_REQUEST_LABELS.HARD_DELETING,
        })
      }

      return renderRowActions(actions)
    },
    [canDelete, canManage, canUpdate, onDelete, onHardDelete, onToggleRead, router, markingReadRequests, markingUnreadRequests, deletingRequests, restoringRequests, hardDeletingRequests],
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
        const isRestoring = restoringRequests.has(row.id)
        actions.push({
          label: CONTACT_REQUEST_LABELS.RESTORE,
          icon: RotateCcw,
          onSelect: () => onRestore(row),
          disabled: deletingRequests.has(row.id) || isRestoring || hardDeletingRequests.has(row.id),
          isLoading: isRestoring,
          loadingLabel: CONTACT_REQUEST_LABELS.RESTORING,
        })
      }

      if (canManage) {
        const isHardDeleting = hardDeletingRequests.has(row.id)
        actions.push({
          label: CONTACT_REQUEST_LABELS.HARD_DELETE,
          icon: AlertTriangle,
          onSelect: () => onHardDelete(row),
          destructive: true,
          disabled: deletingRequests.has(row.id) || restoringRequests.has(row.id) || isHardDeleting,
          isLoading: isHardDeleting,
          loadingLabel: CONTACT_REQUEST_LABELS.HARD_DELETING,
        })
      }

      return renderRowActions(actions)
    },
    [canManage, canRestore, onHardDelete, onRestore, router, deletingRequests, restoringRequests, hardDeletingRequests],
  )

  return {
    renderActiveRowActions,
    renderDeletedRowActions,
  }
}

