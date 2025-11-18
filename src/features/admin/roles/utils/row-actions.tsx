/**
 * Row actions utilities cho roles table
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
import type { RoleRow } from "../types"
import { ROLE_LABELS } from "../constants/messages"

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
  onDelete: (row: RoleRow) => void
  onHardDelete: (row: RoleRow) => void
  onRestore: (row: RoleRow) => void
  deletingRoles?: Set<string>
  restoringRoles?: Set<string>
  hardDeletingRoles?: Set<string>
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

export function useRoleRowActions({
  canDelete,
  canRestore,
  canManage,
  onDelete,
  onHardDelete,
  onRestore,
  deletingRoles = new Set(),
  restoringRoles = new Set(),
  hardDeletingRoles = new Set(),
}: UseRowActionsOptions) {
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
        actions.push({
          label: ROLE_LABELS.DELETE,
          icon: Trash2,
          onSelect: () => onDelete(row),
          destructive: true,
          disabled: row.name === "super_admin" || deletingRoles.has(row.id) || restoringRoles.has(row.id) || hardDeletingRoles.has(row.id),
        })
      }

      if (canManage) {
        actions.push({
          label: ROLE_LABELS.HARD_DELETE,
          icon: AlertTriangle,
          onSelect: () => onHardDelete(row),
          destructive: true,
          disabled: row.name === "super_admin" || deletingRoles.has(row.id) || restoringRoles.has(row.id) || hardDeletingRoles.has(row.id),
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
        actions.push({
          label: ROLE_LABELS.RESTORE,
          icon: RotateCcw,
          onSelect: () => onRestore(row),
          disabled: deletingRoles.has(row.id) || restoringRoles.has(row.id) || hardDeletingRoles.has(row.id),
        })
      }

      if (canManage) {
        actions.push({
          label: ROLE_LABELS.HARD_DELETE,
          icon: AlertTriangle,
          onSelect: () => onHardDelete(row),
          destructive: true,
          disabled: row.name === "super_admin" || deletingRoles.has(row.id) || restoringRoles.has(row.id) || hardDeletingRoles.has(row.id),
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

