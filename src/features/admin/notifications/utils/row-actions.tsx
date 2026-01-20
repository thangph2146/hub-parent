import { useCallback } from "react"
import { useResourceNavigation } from "@/features/admin/resources/hooks"
import { Trash2, Eye } from "lucide-react"
import { renderRowActions, type RowActionConfig } from "@/features/admin/resources/utils/render-row-actions"
import type { NotificationRow } from "../types"
import { NOTIFICATION_LABELS } from "../constants"

interface UseRowActionsOptions {
  sessionUserId?: string  
  onDelete: (row: NotificationRow) => void
  deletingNotifications?: Set<string>
}

export const useNotificationRowActions = ({
  sessionUserId,
  onDelete,
  deletingNotifications = new Set(),
}: UseRowActionsOptions) => {
  const { navigate } = useResourceNavigation()

  const renderRowActionsForNotifications = useCallback(
    (row: NotificationRow) => {
      const isOwner = sessionUserId === row.userId
      const canDelete = isOwner && row.kind !== "SYSTEM"

      const actions: RowActionConfig[] = [
        {
          label: NOTIFICATION_LABELS.VIEW_DETAIL,
          icon: Eye,
          onSelect: () => navigate(`/admin/notifications/${row.id}`),
        },
      ]

      if (canDelete) {
        const isDeleting = deletingNotifications.has(row.id)
        actions.push({
          label: NOTIFICATION_LABELS.DELETE,
          icon: Trash2,
          onSelect: () => onDelete(row),
          destructive: true,
          disabled: isDeleting,
          isLoading: isDeleting,
          loadingLabel: NOTIFICATION_LABELS.DELETING,
        })
      }

      return renderRowActions(actions)
    },
    [sessionUserId, onDelete, deletingNotifications, navigate],
  )

  return {
    renderRowActionsForNotifications,
  }
}

