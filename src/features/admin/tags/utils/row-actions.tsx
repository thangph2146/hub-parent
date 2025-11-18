/**
 * Row actions utilities cho tags table
 */

import { useCallback } from "react"
import { useResourceRouter } from "@/hooks/use-resource-segment"
import { RotateCcw, Trash2, MoreHorizontal, AlertTriangle, Eye, Pencil } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { TagRow } from "../types"
import { TAG_LABELS } from "../constants/messages"

export interface RowActionConfig {
  label: string
  icon: LucideIcon
  onSelect: () => void
  destructive?: boolean
  disabled?: boolean
}

interface UseRowActionsOptions {
  canDelete: boolean
  canRestore: boolean
  canManage: boolean
  onDelete: (row: TagRow) => void
  onHardDelete: (row: TagRow) => void
  onRestore: (row: TagRow) => void
  deletingTags?: Set<string>
  restoringTags?: Set<string>
  hardDeletingTags?: Set<string>
}

export function renderRowActions(actions: RowActionConfig[]) {
  if (actions.length === 0) {
    return null
  }

  if (actions.length === 1) {
    const singleAction = actions[0]
    const Icon = singleAction.icon
    return (
      <Button
        variant="ghost"
        size="sm"
        disabled={singleAction.disabled}
        onClick={() => {
          if (singleAction.disabled) return
          singleAction.onSelect()
        }}
      >
        <Icon className="mr-2 h-5 w-5" />
        {singleAction.label}
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
          const Icon = action.icon
          return (
            <DropdownMenuItem
              key={action.label}
              disabled={action.disabled}
              onClick={() => {
                if (action.disabled) return
                action.onSelect()
              }}
              className={
                action.destructive
                  ? "text-destructive focus:text-destructive disabled:opacity-50"
                  : "disabled:opacity-50"
              }
            >
              <Icon
                className={
                  action.destructive ? "mr-2 h-5 w-5 text-destructive" : "mr-2 h-5 w-5"
                }
              />
              {action.label}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function useTagRowActions({
  canDelete,
  canRestore,
  canManage,
  onDelete,
  onHardDelete,
  onRestore,
  deletingTags = new Set(),
  restoringTags = new Set(),
  hardDeletingTags = new Set(),
}: UseRowActionsOptions) {
  const router = useResourceRouter()

  const renderActiveRowActions = useCallback(
    (row: TagRow) => {
      const actions: RowActionConfig[] = [
        {
          label: TAG_LABELS.VIEW_DETAIL,
          icon: Eye,
          onSelect: () => router.push(`/admin/tags/${row.id}`),
        },
      ]

      if (canManage) {
        actions.push({
          label: TAG_LABELS.EDIT,
          icon: Pencil,
          onSelect: () => router.push(`/admin/tags/${row.id}/edit`),
        })
      }

      if (canDelete) {
        actions.push({
          label: TAG_LABELS.DELETE,
          icon: Trash2,
          onSelect: () => onDelete(row),
          destructive: true,
          disabled: deletingTags.has(row.id) || restoringTags.has(row.id) || hardDeletingTags.has(row.id),
        })
      }

      if (canManage) {
        actions.push({
          label: TAG_LABELS.HARD_DELETE,
          icon: AlertTriangle,
          onSelect: () => onHardDelete(row),
          destructive: true,
          disabled: deletingTags.has(row.id) || restoringTags.has(row.id) || hardDeletingTags.has(row.id),
        })
      }

      return renderRowActions(actions)
    },
    [canDelete, canManage, onDelete, onHardDelete, router, deletingTags, restoringTags, hardDeletingTags],
  )

  const renderDeletedRowActions = useCallback(
    (row: TagRow) => {
      const actions: RowActionConfig[] = [
        {
          label: TAG_LABELS.VIEW_DETAIL,
          icon: Eye,
          onSelect: () => router.push(`/admin/tags/${row.id}`),
        },
      ]

      if (canRestore) {
        actions.push({
          label: TAG_LABELS.RESTORE,
          icon: RotateCcw,
          onSelect: () => onRestore(row),
          disabled: deletingTags.has(row.id) || restoringTags.has(row.id) || hardDeletingTags.has(row.id),
        })
      }

      if (canManage) {
        actions.push({
          label: TAG_LABELS.HARD_DELETE,
          icon: AlertTriangle,
          onSelect: () => onHardDelete(row),
          destructive: true,
          disabled: deletingTags.has(row.id) || restoringTags.has(row.id) || hardDeletingTags.has(row.id),
        })
      }

      return renderRowActions(actions)
    },
    [canManage, canRestore, onHardDelete, onRestore, router, deletingTags, restoringTags, hardDeletingTags],
  )

  return {
    renderActiveRowActions,
    renderDeletedRowActions,
  }
}

