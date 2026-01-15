import { useCallback } from "react"
import { useResourceRouter } from "@/hooks"
import { RotateCcw, Trash2, AlertTriangle, Eye, Pencil, CheckCircle, XCircle } from "lucide-react"
import { renderRowActions, type RowActionConfig } from "@/features/admin/resources/utils/render-row-actions"
import type { UserRow } from "../types"
import { USER_LABELS, PROTECTED_SUPER_ADMIN_EMAIL } from "../constants"

interface UseRowActionsOptions {
  canDelete: boolean
  canRestore: boolean
  canManage: boolean
  onDelete: (row: UserRow) => void
  onHardDelete: (row: UserRow) => void
  onRestore: (row: UserRow) => void
  onActive: (row: UserRow) => void
  onUnactive: (row: UserRow) => void
  deletingIds?: Set<string>
  restoringIds?: Set<string>
  hardDeletingIds?: Set<string>
  activatingIds?: Set<string>
  deactivatingIds?: Set<string>
  currentUserEmail?: string
}

export const useUserRowActions = ({
  canDelete,
  canRestore,
  canManage,
  onDelete,
  onHardDelete,
  onRestore,
  onActive,
  onUnactive,
  deletingIds = new Set(),
  restoringIds = new Set(),
  hardDeletingIds = new Set(),
  activatingIds = new Set(),
  deactivatingIds = new Set(),
  currentUserEmail,
}: UseRowActionsOptions) => {
  const router = useResourceRouter()

  const renderActiveRowActions = useCallback(
    (row: UserRow) => {
      const actions: RowActionConfig[] = [
        {
          label: USER_LABELS.VIEW_DETAIL,
          icon: Eye,
          onSelect: () => {
            // Logging được xử lý bởi useResourceRouter
            router.push(`/admin/users/${row.id}`)
          },
        },
      ]

      if (canManage) {
        actions.push({
          label: USER_LABELS.EDIT,
          icon: Pencil,
          onSelect: () => {
            // Logging được xử lý bởi useResourceRouter
            router.push(`/admin/users/${row.id}/edit`)
          },
        })

        if (!row.isActive) {
          const isActivating = activatingIds.has(row.id)
          actions.push({
            label: USER_LABELS.ACTIVATE,
            icon: CheckCircle,
            onSelect: () => onActive(row),
            disabled: isActivating || deactivatingIds.has(row.id),
            isLoading: isActivating,
            loadingLabel: "Đang kích hoạt...",
          })
        } else {
          const isDeactivating = deactivatingIds.has(row.id)
          const isSuperAdmin = row.email === PROTECTED_SUPER_ADMIN_EMAIL
          const isOwnAccount = row.email === currentUserEmail
          actions.push({
            label: USER_LABELS.DEACTIVATE,
            icon: XCircle,
            onSelect: () => onUnactive(row),
            disabled: isDeactivating || activatingIds.has(row.id) || isSuperAdmin || isOwnAccount,
            isLoading: isDeactivating,
            loadingLabel: "Đang vô hiệu hóa...",
          })
        }
      }

      if (canDelete) {
        const isDeleting = deletingIds.has(row.id)
        const isSuperAdmin = row.email === PROTECTED_SUPER_ADMIN_EMAIL
        const isOwnAccount = row.email === currentUserEmail
        actions.push({
          label: USER_LABELS.DELETE,
          icon: Trash2,
          onSelect: () => onDelete(row),
          destructive: true,
          disabled: isDeleting || restoringIds.has(row.id) || hardDeletingIds.has(row.id) || isSuperAdmin || isOwnAccount,
          isLoading: isDeleting,
          loadingLabel: USER_LABELS.DELETING,
        })
      }

      if (canManage) {
        const isHardDeleting = hardDeletingIds.has(row.id)
        const isSuperAdmin = row.email === PROTECTED_SUPER_ADMIN_EMAIL
        const isOwnAccount = row.email === currentUserEmail
        actions.push({
          label: USER_LABELS.HARD_DELETE,
          icon: AlertTriangle,
          onSelect: () => onHardDelete(row),
          destructive: true,
          disabled: deletingIds.has(row.id) || restoringIds.has(row.id) || isHardDeleting || isSuperAdmin || isOwnAccount,
          isLoading: isHardDeleting,
          loadingLabel: USER_LABELS.HARD_DELETING,
        })
      }

      return renderRowActions(actions)
    },
    [canDelete, canManage, onDelete, onHardDelete, onActive, onUnactive, router, deletingIds, restoringIds, hardDeletingIds, activatingIds, deactivatingIds, currentUserEmail],
  )

  const renderDeletedRowActions = useCallback(
    (row: UserRow) => {
      const actions: RowActionConfig[] = [
        {
          label: USER_LABELS.VIEW_DETAIL,
          icon: Eye,
          onSelect: () => {
            // Logging được xử lý bởi useResourceRouter
            router.push(`/admin/users/${row.id}`)
          },
        },
      ]

      if (canRestore) {
        const isRestoring = restoringIds.has(row.id)
        actions.push({
          label: USER_LABELS.RESTORE,
          icon: RotateCcw,
          onSelect: () => onRestore(row),
          disabled: deletingIds.has(row.id) || isRestoring || hardDeletingIds.has(row.id),
          isLoading: isRestoring,
          loadingLabel: USER_LABELS.RESTORING,
        })
      }

      if (canManage) {
        const isHardDeleting = hardDeletingIds.has(row.id)
        const isSuperAdmin = row.email === PROTECTED_SUPER_ADMIN_EMAIL
        const isOwnAccount = row.email === currentUserEmail
        actions.push({
          label: USER_LABELS.HARD_DELETE,
          icon: AlertTriangle,
          onSelect: () => onHardDelete(row),
          destructive: true,
          disabled: deletingIds.has(row.id) || restoringIds.has(row.id) || isHardDeleting || isSuperAdmin || isOwnAccount,
          isLoading: isHardDeleting,
          loadingLabel: USER_LABELS.HARD_DELETING,
        })
      }

      return renderRowActions(actions)
    },
    [canManage, canRestore, onHardDelete, onRestore, router, deletingIds, restoringIds, hardDeletingIds, currentUserEmail],
  )

  return {
    renderActiveRowActions,
    renderDeletedRowActions,
  }
}

