"use client"

import { useCallback, useMemo, useState } from "react"
import { FeedbackDialog } from "@/components/dialogs"
import type { DataTableResult } from "@/components/tables"
import {
  ResourceTableClient,
} from "@/features/admin/resources/components"
import type { ResourceViewMode } from "@/features/admin/resources/types"
import {
  useResourceTableRefresh,
  useResourceTableLogger,
} from "@/features/admin/resources/hooks"
import { useQueryClient } from "@tanstack/react-query"
import { queryKeys, type AdminRolesListParams } from "@/constants"
import { useRolesSocketBridge } from "@/features/admin/roles/hooks/use-roles-socket-bridge"
import { useRoleActions } from "@/features/admin/roles/hooks/use-role-actions"
import { useRoleFeedback } from "@/features/admin/roles/hooks/use-role-feedback"
import { useRoleDeleteConfirm } from "@/features/admin/roles/hooks/use-role-delete-confirm"
import { useRoleColumns } from "@/features/admin/roles/utils/columns"
import { useRoleRowActions } from "@/features/admin/roles/utils/row-actions"
import { useRolesTableFetcher } from "@/features/admin/roles/hooks/use-roles-table-fetcher"
import { ActiveRoleSelectionActions, DeletedRoleSelectionActions } from "./roles-table-sub-sections/RoleSelectionActions"
import { RoleConfirmDialog } from "./roles-table-sub-sections/RoleConfirmDialog"
import { RoleTableToolbar } from "./roles-table-sub-sections/RoleTableToolbar"
import type { RoleRow, RolesTableClientProps } from "../types"
import { ROLE_LABELS } from "../constants/messages"

export const RolesTableClient = ({
  canDelete = false,
  canRestore = false,
  canManage = false,
  canCreate = false,
  initialData,
  initialPermissionsOptions: _initialPermissionsOptions = [],
}: RolesTableClientProps) => {
  const queryClient = useQueryClient()
  const { isSocketConnected, cacheVersion } = useRolesSocketBridge()
  const { feedback, showFeedback, handleFeedbackOpenChange } = useRoleFeedback()
  const { deleteConfirm, setDeleteConfirm, handleDeleteConfirm } = useRoleDeleteConfirm()

  const [currentViewId, setCurrentViewId] = useState<string>("active")

  useResourceTableLogger<RoleRow>({
    resourceName: "roles",
    initialData,
    initialDataByView: initialData ? { active: initialData } : undefined,
    currentViewId,
    queryClient,
    buildQueryKey: (params) => queryKeys.adminRoles.list({
      ...params,
      status: params.status === "inactive" ? "active" : params.status,
      search: undefined,
      filters: undefined,
    }),
    columns: ["id", "name", "displayName", "description", "isActive", "createdAt", "deletedAt"],
    getRowData: (row) => ({
      id: row.id,
      name: row.name,
      displayName: row.displayName,
      description: row.description,
      isActive: row.isActive,
      createdAt: row.createdAt,
      deletedAt: row.deletedAt,
    }),
    cacheVersion,
  })

  const getInvalidateQueryKey = useCallback(() => queryKeys.adminRoles.all(), [])
  const { onRefreshReady } = useResourceTableRefresh({
    queryClient,
    getInvalidateQueryKey,
    cacheVersion,
  })

  const {
    executeSingleAction,
    executeBulkAction,
    deletingIds,
    restoringIds,
    hardDeletingIds,
    activatingIds,
    deactivatingIds,
    bulkState,
  } = useRoleActions({
    canDelete,
    canRestore,
    canManage,
    isSocketConnected,
    showFeedback,
  })

  const togglingIds = useMemo(
    () => new Set([...Array.from(activatingIds), ...Array.from(deactivatingIds)]),
    [activatingIds, deactivatingIds],
  )

  const handleToggleStatusWithRefresh = useCallback(
    (row: RoleRow, checked: boolean) => {
      executeSingleAction(checked ? "active" : "unactive", row)
    },
    [executeSingleAction],
  )

  const { baseColumns, deletedColumns } = useRoleColumns({
    togglingRoles: togglingIds,
    canManage,
    onToggleStatus: handleToggleStatusWithRefresh,
  })

  const handleDeleteSingle = useCallback(
    (row: RoleRow) => {
      if (!canDelete) return
      if (row.name === "super_admin") {
        showFeedback("error", ROLE_LABELS.CANNOT_DELETE, ROLE_LABELS.CANNOT_DELETE_SUPER_ADMIN)
        return
      }
      setDeleteConfirm({
        open: true,
        type: "soft",
        row,
        onConfirm: async () => {
          await executeSingleAction("delete", row)
        },
      })
    },
    [canDelete, executeSingleAction, setDeleteConfirm, showFeedback],
  )

  const handleHardDeleteSingle = useCallback(
    (row: RoleRow) => {
      if (!canManage) return
      if (row.name === "super_admin") {
        showFeedback("error", ROLE_LABELS.CANNOT_DELETE, ROLE_LABELS.CANNOT_HARD_DELETE_SUPER_ADMIN)
        return
      }
      setDeleteConfirm({
        open: true,
        type: "hard",
        row,
        onConfirm: async () => {
          await executeSingleAction("hard-delete", row)
        },
      })
    },
    [canManage, executeSingleAction, setDeleteConfirm, showFeedback],
  )

  const handleRestoreSingle = useCallback(
    (row: RoleRow) => {
      if (!canRestore) return
      setDeleteConfirm({
        open: true,
        type: "restore",
        row,
        onConfirm: async () => {
          await executeSingleAction("restore", row)
        },
      })
    },
    [canRestore, executeSingleAction, setDeleteConfirm],
  )

  const { renderActiveRowActions, renderDeletedRowActions } = useRoleRowActions({
    canDelete,
    canRestore,
    canManage,
    onDelete: handleDeleteSingle,
    onHardDelete: handleHardDeleteSingle,
    onRestore: handleRestoreSingle,
    deletingIds,
    restoringIds,
    hardDeletingIds,
  })

  const { loader } = useRolesTableFetcher()

  const executeBulk = useCallback(
    (action: "delete" | "restore" | "hard-delete", ids: string[], refresh: () => void, clearSelection: () => void) => {
      if (ids.length === 0) return

      if (action === "delete" || action === "restore" || action === "hard-delete") {
        setDeleteConfirm({
          open: true,
          type: action === "hard-delete" ? "hard" : action === "restore" ? "restore" : "soft",
          bulkIds: ids,
          onConfirm: async () => {
            await executeBulkAction(action, ids, refresh, clearSelection)
          },
        })
      } else {
        executeBulkAction(action, ids, refresh, clearSelection)
      }
    },
    [executeBulkAction, setDeleteConfirm],
  )

  const _buildInitialParams = useCallback(
    (data: DataTableResult<RoleRow>): AdminRolesListParams => ({
      status: "active",
      page: data.page,
      limit: data.limit,
      search: undefined,
      filters: undefined,
    }),
    [],
  )


  const viewModes = useMemo<ResourceViewMode<RoleRow>[]>(() => {
    const modes: ResourceViewMode<RoleRow>[] = [
      {
        id: "active",
        label: ROLE_LABELS.ACTIVE_VIEW,
        status: "active",
        columns: baseColumns,
        selectionEnabled: canDelete,
        selectionActions: canDelete
          ? (props) => (
            <ActiveRoleSelectionActions
              {...props}
              canManage={canManage}
              isProcessing={bulkState.isProcessing}
              executeBulk={executeBulk}
            />
          )
          : undefined,
        rowActions: (row) => renderActiveRowActions(row),
        emptyMessage: ROLE_LABELS.NO_ROLES,
      },
      {
        id: "deleted",
        label: ROLE_LABELS.DELETED_VIEW,
        status: "deleted",
        columns: deletedColumns,
        selectionEnabled: canRestore || canManage,
        selectionActions: canRestore || canManage
          ? (props) => (
            <DeletedRoleSelectionActions
              {...props}
              canManage={canManage}
              canRestore={canRestore}
              isProcessing={bulkState.isProcessing}
              executeBulk={executeBulk}
            />
          )
          : undefined,
        rowActions: (row) => renderDeletedRowActions(row),
        emptyMessage: ROLE_LABELS.NO_DELETED_ROLES,
      },
    ]

    return modes
  }, [
    canDelete,
    canRestore,
    canManage,
    baseColumns,
    deletedColumns,
    bulkState.isProcessing,
    executeBulk,
    renderActiveRowActions,
    renderDeletedRowActions,
  ])

  const initialDataByView = useMemo(
    () => (initialData ? { active: initialData } : undefined),
    [initialData],
  )

  const headerActions = <RoleTableToolbar canCreate={canCreate} />

  return (
    <>
      <ResourceTableClient<RoleRow>
        title={ROLE_LABELS.MANAGE_ROLES}
        baseColumns={baseColumns}
        loader={loader}
        viewModes={viewModes}
        defaultViewId="active"
        initialDataByView={initialDataByView}
        fallbackRowCount={6}
        headerActions={headerActions}
        onRefreshReady={onRefreshReady}
        onViewChange={setCurrentViewId}
      />

      <RoleConfirmDialog
        deleteConfirm={deleteConfirm}
        onOpenChange={(open) => {
          if (!open) setDeleteConfirm(null)
        }}
        onConfirm={handleDeleteConfirm}
        isProcessing={bulkState.isProcessing}
        deletingIds={deletingIds}
        restoringIds={restoringIds}
        hardDeletingIds={hardDeletingIds}
      />

      {/* Feedback Dialog */}
      {feedback && (
        <FeedbackDialog
          open={feedback.open}
          onOpenChange={handleFeedbackOpenChange}
          variant={feedback.variant}
          title={feedback.title}
          description={feedback.description}
          details={feedback.details}
        />
      )}
    </>
  )
}

