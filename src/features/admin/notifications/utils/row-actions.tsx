/**
 * Row actions utilities cho notifications table
 */

import { useCallback } from "react"
import { useResourceRouter } from "@/hooks/use-resource-segment"
import { Trash2, MoreHorizontal, Eye, Check, X, Loader2 } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { NotificationRow } from "../types"
import { NOTIFICATION_LABELS } from "../constants"

export interface RowActionConfig {
  label: string
  icon: LucideIcon
  onSelect: () => void
  destructive?: boolean
  disabled?: boolean
  isLoading?: boolean
  loadingLabel?: string
}

interface UseRowActionsOptions {
  sessionUserId?: string
  onToggleRead: (row: NotificationRow, checked: boolean) => void
  onDelete: (row: NotificationRow) => void
  markingReadNotifications?: Set<string>
  markingUnreadNotifications?: Set<string>
  deletingNotifications?: Set<string>
}

export function renderRowActions(actions: RowActionConfig[]) {
  if (actions.length === 0) {
    return null
  }

  if (actions.length === 1) {
    const singleAction = actions[0]
    const Icon = singleAction.isLoading ? Loader2 : singleAction.icon
    return (
      <Button
        variant="ghost"
        size="sm"
        disabled={singleAction.disabled || singleAction.isLoading}
        onClick={() => {
          if (singleAction.disabled || singleAction.isLoading) return
          singleAction.onSelect()
        }}
      >
        <Icon className={`mr-2 h-5 w-5 ${singleAction.isLoading ? "animate-spin" : ""}`} />
        {singleAction.isLoading ? singleAction.loadingLabel || singleAction.label : singleAction.label}
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {actions.map((action) => {
          const Icon = action.isLoading ? Loader2 : action.icon
          return (
            <DropdownMenuItem
              key={action.label}
              disabled={action.disabled || action.isLoading}
              onClick={() => {
                if (action.disabled || action.isLoading) return
                action.onSelect()
              }}
              className={
                action.destructive
                  ? "text-destructive focus:text-destructive hover:text-destructive hover:bg-destructive/10 disabled:opacity-50"
                  : "hover:bg-accent/10 disabled:opacity-50"
              }
            >
              <Icon
                className={
                  action.destructive
                    ? `mr-2 h-5 w-5 text-destructive ${action.isLoading ? "animate-spin" : ""}`
                    : `mr-2 h-5 w-5 ${action.isLoading ? "animate-spin" : ""}`
                }
              />
              {action.isLoading ? action.loadingLabel || action.label : action.label}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function useNotificationRowActions({
  sessionUserId,
  onToggleRead,
  onDelete,
  markingReadNotifications = new Set(),
  markingUnreadNotifications = new Set(),
  deletingNotifications = new Set(),
}: UseRowActionsOptions) {
  const router = useResourceRouter()

  const renderRowActionsForNotifications = useCallback(
    (row: NotificationRow) => {
      const isOwner = sessionUserId === row.userId
      const canDelete = isOwner && row.kind !== "SYSTEM"

      const actions: RowActionConfig[] = [
        {
          label: NOTIFICATION_LABELS.VIEW_DETAIL,
          icon: Eye,
          onSelect: () => router.push(`/admin/notifications/${row.id}`),
        },
      ]

      if (isOwner) {
        if (row.isRead) {
          const isMarkingUnread = markingUnreadNotifications.has(row.id)
          actions.push({
            label: NOTIFICATION_LABELS.MARK_UNREAD,
            icon: X,
            onSelect: () => onToggleRead(row, false),
            disabled: isMarkingUnread || markingReadNotifications.has(row.id) || deletingNotifications.has(row.id),
            isLoading: isMarkingUnread,
            loadingLabel: NOTIFICATION_LABELS.MARKING_UNREAD,
          })
        } else {
          const isMarkingRead = markingReadNotifications.has(row.id)
          actions.push({
            label: NOTIFICATION_LABELS.MARK_READ,
            icon: Check,
            onSelect: () => onToggleRead(row, true),
            disabled: isMarkingRead || markingUnreadNotifications.has(row.id) || deletingNotifications.has(row.id),
            isLoading: isMarkingRead,
            loadingLabel: NOTIFICATION_LABELS.MARKING_READ,
          })
        }
      }

      if (canDelete) {
        const isDeleting = deletingNotifications.has(row.id)
        actions.push({
          label: NOTIFICATION_LABELS.DELETE,
          icon: Trash2,
          onSelect: () => onDelete(row),
          destructive: true,
          disabled: isDeleting || markingReadNotifications.has(row.id) || markingUnreadNotifications.has(row.id),
          isLoading: isDeleting,
          loadingLabel: NOTIFICATION_LABELS.DELETING,
        })
      }

      return renderRowActions(actions)
    },
    [sessionUserId, onToggleRead, onDelete, router, markingReadNotifications, markingUnreadNotifications, deletingNotifications],
  )

  return {
    renderRowActionsForNotifications,
  }
}

