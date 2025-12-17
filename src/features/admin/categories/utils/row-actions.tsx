import { useCallback } from "react"
import { useResourceRouter } from "@/hooks/use-resource-segment"
import { RotateCcw, Trash2, AlertTriangle, Eye, Pencil } from "lucide-react"
import { renderRowActions, type RowActionConfig } from "@/features/admin/resources/utils/render-row-actions"
import type { CategoryRow } from "../types"
import { CATEGORY_LABELS } from "../constants/messages"

interface UseRowActionsOptions {
  canDelete: boolean
  canRestore: boolean
  canManage: boolean
  onDelete: (row: CategoryRow) => void
  onHardDelete: (row: CategoryRow) => void
  onRestore: (row: CategoryRow) => void
  deletingCategories?: Set<string>
  restoringCategories?: Set<string>
  hardDeletingCategories?: Set<string>
}

export const useCategoryRowActions = ({
  canDelete,
  canRestore,
  canManage,
  onDelete,
  onHardDelete,
  onRestore,
  deletingCategories = new Set(),
  restoringCategories = new Set(),
  hardDeletingCategories = new Set(),
}: UseRowActionsOptions) => {
  const router = useResourceRouter()

  const renderActiveRowActions = useCallback(
    (row: CategoryRow) => {
      const actions: RowActionConfig[] = [
        {
          label: CATEGORY_LABELS.VIEW_DETAIL,
          icon: Eye,
          onSelect: () => router.push(`/admin/categories/${row.id}`),
        },
      ]

      if (canManage) {
        actions.push({
          label: CATEGORY_LABELS.EDIT,
          icon: Pencil,
          onSelect: () => router.push(`/admin/categories/${row.id}/edit`),
        })
      }

      if (canDelete) {
        const isDeleting = deletingCategories.has(row.id)
        actions.push({
          label: CATEGORY_LABELS.DELETE,
          icon: Trash2,
          onSelect: () => onDelete(row),
          destructive: true,
          disabled: isDeleting || restoringCategories.has(row.id) || hardDeletingCategories.has(row.id),
          isLoading: isDeleting,
          loadingLabel: CATEGORY_LABELS.DELETING,
        })
      }

      if (canManage) {
        const isHardDeleting = hardDeletingCategories.has(row.id)
        actions.push({
          label: CATEGORY_LABELS.HARD_DELETE,
          icon: AlertTriangle,
          onSelect: () => onHardDelete(row),
          destructive: true,
          disabled: deletingCategories.has(row.id) || restoringCategories.has(row.id) || isHardDeleting,
          isLoading: isHardDeleting,
          loadingLabel: CATEGORY_LABELS.HARD_DELETING,
        })
      }

      return renderRowActions(actions)
    },
    [canDelete, canManage, onDelete, onHardDelete, router, deletingCategories, restoringCategories, hardDeletingCategories],
  )

  const renderDeletedRowActions = useCallback(
    (row: CategoryRow) => {
      const actions: RowActionConfig[] = [
        {
          label: CATEGORY_LABELS.VIEW_DETAIL,
          icon: Eye,
          onSelect: () => router.push(`/admin/categories/${row.id}`),
        },
      ]

      if (canRestore) {
        const isRestoring = restoringCategories.has(row.id)
        actions.push({
          label: CATEGORY_LABELS.RESTORE,
          icon: RotateCcw,
          onSelect: () => onRestore(row),
          disabled: deletingCategories.has(row.id) || isRestoring || hardDeletingCategories.has(row.id),
          isLoading: isRestoring,
          loadingLabel: CATEGORY_LABELS.RESTORING,
        })
      }

      if (canManage) {
        const isHardDeleting = hardDeletingCategories.has(row.id)
        actions.push({
          label: CATEGORY_LABELS.HARD_DELETE,
          icon: AlertTriangle,
          onSelect: () => onHardDelete(row),
          destructive: true,
          disabled: deletingCategories.has(row.id) || restoringCategories.has(row.id) || isHardDeleting,
          isLoading: isHardDeleting,
          loadingLabel: CATEGORY_LABELS.HARD_DELETING,
        })
      }

      return renderRowActions(actions)
    },
    [canManage, canRestore, onHardDelete, onRestore, router, deletingCategories, restoringCategories, hardDeletingCategories],
  )

  return {
    renderActiveRowActions,
    renderDeletedRowActions,
  }
}

