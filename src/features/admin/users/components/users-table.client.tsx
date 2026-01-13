"use client"

import { useCallback, useMemo, useState } from "react"
import { usePageLoadLogger } from "@/hooks"

import { FeedbackDialog } from "@/components/dialogs"
import {
  ResourceTableClient,
} from "@/features/admin/resources/components"
import type { ResourceViewMode } from "@/features/admin/resources/types"
import {
  useResourceTableRefresh,
  useResourceTableLogger,
} from "@/features/admin/resources/hooks"
import { useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "@/constants"
import { useUsersSocketBridge } from "@/features/admin/users/hooks/use-users-socket-bridge"
import { useUserActions } from "@/features/admin/users/hooks/use-user-actions"
import { useUserFeedback } from "@/features/admin/users/hooks/use-user-feedback"
import { useUserDeleteConfirm } from "@/features/admin/users/hooks/use-user-delete-confirm"
import { useUserColumns } from "@/features/admin/users/utils/columns"
import { useUserRowActions } from "@/features/admin/users/utils/row-actions"
import { resourceLogger } from "@/utils"

import type { UserRow, UsersTableClientProps } from "../types"
import { USER_LABELS } from "../constants"
import { useUsersTableFetcher } from "@/features/admin/users/hooks/use-users-table-fetcher"
import { ActiveUserSelectionActions, DeletedUserSelectionActions } from "./users-table-sub-sections/UserSelectionActions"
import { UserConfirmDialog } from "./users-table-sub-sections/UserConfirmDialog"
import { UserTableToolbar } from "./users-table-sub-sections/UserTableToolbar"

export const UsersTableClient = ({
  canDelete = false,
  canRestore = false,
  canManage = false,
  canCreate = false,
  initialData,
  initialRolesOptions = [],
}: UsersTableClientProps) => {
  const queryClient = useQueryClient()

  // Log page load
  usePageLoadLogger("list")
  const { cacheVersion } = useUsersSocketBridge()
  const { feedback, showFeedback, handleFeedbackOpenChange } = useUserFeedback()
  const { deleteConfirm, setDeleteConfirm, handleDeleteConfirm } = useUserDeleteConfirm()

  const getInvalidateQueryKey = useCallback(() => queryKeys.adminUsers.all(), [])
  const { onRefreshReady, refresh: refreshTable } = useResourceTableRefresh({
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
  } = useUserActions({
    canDelete,
    canRestore,
    canManage,
    showFeedback,
  })

  const togglingIds = useMemo(
    () => new Set([...Array.from(activatingIds), ...Array.from(deactivatingIds)]),
    [activatingIds, deactivatingIds],
  )

  const handleToggleStatus = useCallback(
    (row: UserRow, newStatus: boolean) => {
      executeSingleAction(newStatus ? "active" : "unactive", row, refreshTable)
    },
    [executeSingleAction, refreshTable],
  )

  const { baseColumns, deletedColumns } = useUserColumns({
    rolesOptions: initialRolesOptions,
    canManage,
    togglingUsers: togglingIds,
    onToggleStatus: handleToggleStatus,
    showFeedback,
  })

  const { loader } = useUsersTableFetcher()

  const handleDeleteSingle = useCallback(
    (row: UserRow) => {
      if (!canDelete) return
      resourceLogger.logAction({
        resource: "users",
        action: "delete",
        resourceId: row.id,
        userEmail: row.email,
        userName: row.name,
      })
      setDeleteConfirm({
        open: true,
        type: "soft",
        row,
        onConfirm: async () => {
          await executeSingleAction("delete", row, refreshTable)
        },
      })
    },
    [canDelete, executeSingleAction, refreshTable, setDeleteConfirm],
  )

  const handleHardDeleteSingle = useCallback(
    (row: UserRow) => {
      if (!canManage) return
      resourceLogger.logAction({
        resource: "users",
        action: "hard-delete",
        resourceId: row.id,
        userEmail: row.email,
        userName: row.name,
      })
      setDeleteConfirm({
        open: true,
        type: "hard",
        row,
        onConfirm: async () => {
          await executeSingleAction("hard-delete", row, refreshTable)
        },
      })
    },
    [canManage, executeSingleAction, refreshTable, setDeleteConfirm],
  )

  const handleRestoreSingle = useCallback(
    (row: UserRow) => {
      if (!canRestore) return
      resourceLogger.logAction({
        resource: "users",
        action: "restore",
        resourceId: row.id,
        userEmail: row.email,
        userName: row.name,
      })
      setDeleteConfirm({
        open: true,
        type: "restore",
        row,
        onConfirm: async () => {
          await executeSingleAction("restore", row, refreshTable)
        },
      })
    },
    [canRestore, executeSingleAction, refreshTable, setDeleteConfirm],
  )

  const handleActiveSingle = useCallback(
    (row: UserRow) => {
      if (!canManage) return
      resourceLogger.logAction({
        resource: "users",
        action: "active",
        resourceId: row.id,
        userEmail: row.email,
        userName: row.name,
      })
      setDeleteConfirm({
        open: true,
        type: "active",
        row,
        onConfirm: async () => {
          await executeSingleAction("active", row, refreshTable)
        },
      })
    },
    [canManage, executeSingleAction, refreshTable, setDeleteConfirm],
  )

  const handleUnactiveSingle = useCallback(
    (row: UserRow) => {
      if (!canManage) return
      resourceLogger.logAction({
        resource: "users",
        action: "unactive",
        resourceId: row.id,
        userEmail: row.email,
        userName: row.name,
      })
      setDeleteConfirm({
        open: true,
        type: "unactive",
        row,
        onConfirm: async () => {
          await executeSingleAction("unactive", row, refreshTable)
        },
      })
    },
    [canManage, executeSingleAction, refreshTable, setDeleteConfirm],
  )

  const { renderActiveRowActions, renderDeletedRowActions } = useUserRowActions({
    canDelete,
    canRestore,
    canManage,
    onDelete: handleDeleteSingle,
    onHardDelete: handleHardDeleteSingle,
    onRestore: handleRestoreSingle,
    onActive: handleActiveSingle,
    onUnactive: handleUnactiveSingle,
    deletingIds,
    restoringIds,
    hardDeletingIds,
    activatingIds,
    deactivatingIds,
  })

  const executeBulk = useCallback(
    (action: "delete" | "restore" | "hard-delete" | "active" | "unactive", ids: string[], selectedRows: UserRow[], refresh: () => void, clearSelection: () => void) => {
      if (ids.length === 0) return

      resourceLogger.logAction({
        resource: "users",
        action: action === "delete" 
          ? "bulk-delete" 
          : action === "restore" 
          ? "bulk-restore" 
          : action === "active"
          ? "bulk-active"
          : action === "unactive"
          ? "bulk-unactive"
          : "bulk-hard-delete",
        count: ids.length,
        userIds: ids,
      })

      setDeleteConfirm({
        open: true,
        type: action === "hard-delete" 
          ? "hard" 
          : action === "restore" 
          ? "restore" 
          : action === "active"
          ? "active"
          : action === "unactive"
          ? "unactive"
          : "soft",
        bulkIds: ids,
        onConfirm: async () => {
          await executeBulkAction(action, ids, refresh, clearSelection, selectedRows)
        },
      })
    },
    [executeBulkAction, setDeleteConfirm],
  )

  const viewModes = useMemo<ResourceViewMode<UserRow>[]>(() => {
    const modes: ResourceViewMode<UserRow>[] = [
      {
        id: "active",
        label: USER_LABELS.ACTIVE_VIEW,
        status: "active",
        selectionEnabled: canDelete,
        selectionActions: canDelete
          ? (props) => (
            <ActiveUserSelectionActions
              {...props}
              canManage={canManage}
              isProcessing={bulkState.isProcessing}
              executeBulk={executeBulk}
            />
          )
          : undefined,
        rowActions: (row) => renderActiveRowActions(row),
        emptyMessage: USER_LABELS.NO_USERS,
      },
      {
        id: "deleted",
        label: USER_LABELS.DELETED_VIEW,
        status: "deleted",
        columns: deletedColumns,
        selectionEnabled: canRestore || canManage,
        selectionActions: canRestore || canManage
          ? (props) => (
            <DeletedUserSelectionActions
              {...props}
              canManage={canManage}
              canRestore={canRestore}
              isProcessing={bulkState.isProcessing}
              executeBulk={executeBulk}
            />
          )
          : undefined,
        rowActions: (row) => renderDeletedRowActions(row),
        emptyMessage: USER_LABELS.NO_DELETED_USERS,
      },
    ]

    return modes
  }, [
    canDelete,
    canRestore,
    canManage,
    deletedColumns,
    executeBulk,
    bulkState.isProcessing,
    renderActiveRowActions,
    renderDeletedRowActions,
  ])

  const initialDataByView = useMemo(
    () => (initialData ? { active: initialData } : undefined),
    [initialData],
  )

  const [currentViewId, setCurrentViewId] = useState<string>("active")

  useResourceTableLogger<UserRow>({
    resourceName: "users",
    initialData,
    initialDataByView,
    currentViewId,
    queryClient,
    buildQueryKey: (params) => queryKeys.adminUsers.list({
      ...params,
      status: params.status === "inactive" ? "active" : params.status,
      search: undefined,
      filters: undefined,
    }),
    columns: ["id", "email", "name", "isActive", "createdAt", "deletedAt"],
    getRowData: (row) => ({
      id: row.id,
      email: row.email,
      name: row.name,
      isActive: row.isActive,
      createdAt: row.createdAt,
      deletedAt: row.deletedAt,
    }),
    cacheVersion,
  })

  const headerActions = <UserTableToolbar canCreate={canCreate} />

  return (
    <>
      <ResourceTableClient<UserRow>
        title={USER_LABELS.MANAGE_USERS}
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

      <UserConfirmDialog
        deleteConfirm={deleteConfirm as any}
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


