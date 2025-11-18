"use client"

import { useCallback, useEffect, useMemo, useRef } from "react"
import { useResourceRouter } from "@/hooks/use-resource-segment"
import { Plus, RotateCcw, Trash2, AlertTriangle } from "lucide-react"

import { ConfirmDialog } from "@/components/dialogs"
import type { DataTableQueryState, DataTableResult } from "@/components/tables"
import { FeedbackDialog } from "@/components/dialogs"
import { Button } from "@/components/ui/button"
import { ResourceTableClient } from "@/features/admin/resources/components/resource-table.client"
import type { ResourceViewMode } from "@/features/admin/resources/types"
import { apiClient } from "@/lib/api/axios"
import { apiRoutes } from "@/lib/api/routes"
import { useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "@/lib/query-keys"
import { useRolesSocketBridge } from "@/features/admin/roles/hooks/use-roles-socket-bridge"
import { useRoleActions } from "@/features/admin/roles/hooks/use-role-actions"
import { useRoleFeedback } from "@/features/admin/roles/hooks/use-role-feedback"
import { useRoleDeleteConfirm } from "@/features/admin/roles/hooks/use-role-delete-confirm"
import { useRoleColumns } from "@/features/admin/roles/utils/columns"
import { useRoleRowActions } from "@/features/admin/roles/utils/row-actions"

import type { AdminRolesListParams } from "@/lib/query-keys"
import type { RoleRow, RolesResponse, RolesTableClientProps } from "../types"
import { ROLE_CONFIRM_MESSAGES, ROLE_LABELS } from "../constants/messages"
import { logger } from "@/lib/config"

export function RolesTableClient({
  canDelete = false,
  canRestore = false,
  canManage = false,
  canCreate = false,
  initialData,
  initialPermissionsOptions: _initialPermissionsOptions = [],
}: RolesTableClientProps) {
  const queryClient = useQueryClient()
  const { isSocketConnected, cacheVersion } = useRolesSocketBridge()
  const { feedback, showFeedback, handleFeedbackOpenChange } = useRoleFeedback()
  const { deleteConfirm, setDeleteConfirm, handleDeleteConfirm } = useRoleDeleteConfirm()

  const tableRefreshRef = useRef<(() => void) | null>(null)
  const tableSoftRefreshRef = useRef<(() => void) | null>(null)
  const pendingRealtimeRefreshRef = useRef(false)

  const {
    handleToggleStatus,
    executeSingleAction,
    executeBulkAction,
    togglingRoles,
    deletingRoles,
    restoringRoles,
    hardDeletingRoles,
    bulkState,
  } = useRoleActions({
    canDelete,
    canRestore,
    canManage,
    isSocketConnected,
    showFeedback,
  })

  const handleToggleStatusWithRefresh = useCallback(
    (row: RoleRow, checked: boolean) => {
      if (tableRefreshRef.current) {
        handleToggleStatus(row, checked, tableRefreshRef.current)
      }
    },
    [handleToggleStatus],
  )

  const { baseColumns, deletedColumns } = useRoleColumns({
    togglingRoles,
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
          await executeSingleAction("delete", row, tableRefreshRef.current || (() => {}))
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
          await executeSingleAction("hard-delete", row, tableRefreshRef.current || (() => {}))
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
          await executeSingleAction("restore", row, tableRefreshRef.current || (() => {}))
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
    deletingRoles,
    restoringRoles,
    hardDeletingRoles,
  })

  const buildFiltersRecord = useCallback((filters: Record<string, string>): Record<string, string> => {
    return Object.entries(filters).reduce<Record<string, string>>((acc, [key, value]) => {
      if (value) {
        acc[key] = value
      }
      return acc
    }, {})
  }, [])

  const fetchRoles = useCallback(
    async ({
      page,
      limit,
      status,
      search,
      filters,
    }: {
      page: number
      limit: number
      status: "active" | "deleted" | "all"
      search?: string
      filters?: Record<string, string>
    }): Promise<DataTableResult<RoleRow>> => {
      const baseUrl = apiRoutes.roles.list({
        page,
        limit,
        status,
        search,
      })

      const filterParams = new URLSearchParams()
      Object.entries(filters ?? {}).forEach(([key, value]) => {
        if (value) {
          filterParams.set(`filter[${key}]`, value)
        }
      })

      const filterString = filterParams.toString()
      const url = filterString ? `${baseUrl}&${filterString}` : baseUrl

      const response = await apiClient.get<RolesResponse>(url)
      const payload = response.data

      if (!payload || !payload.data) {
        throw new Error("Không thể tải danh sách vai trò")
      }

      return {
        rows: payload.data || [],
        page: payload.pagination?.page ?? page,
        limit: payload.pagination?.limit ?? limit,
        total: payload.pagination?.total ?? 0,
        totalPages: payload.pagination?.totalPages ?? 0,
      }
    },
    [],
  )

  const loader = useCallback(
    async (query: DataTableQueryState, view: ResourceViewMode<RoleRow>) => {
      const status = (view.status ?? "active") as AdminRolesListParams["status"]
      const search = query.search.trim() || undefined
      const filters = buildFiltersRecord(query.filters)

      const params: AdminRolesListParams = {
        status,
        page: query.page,
        limit: query.limit,
        search,
        filters,
      }

      const queryKey = queryKeys.adminRoles.list(params)

      return await queryClient.fetchQuery({
        queryKey,
        staleTime: Infinity,
        queryFn: () =>
          fetchRoles({
            page: query.page,
            limit: query.limit,
            status: status ?? "active",
            search,
            filters,
          }),
      })
    },
    [buildFiltersRecord, fetchRoles, queryClient],
  )

  const executeBulk = useCallback(
    (action: "delete" | "restore" | "hard-delete", ids: string[], refresh: () => void, clearSelection: () => void) => {
      if (ids.length === 0) return

      // Actions cần confirmation
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

  // Handle realtime updates từ socket bridge
  useEffect(() => {
    if (cacheVersion === 0) return
    if (tableSoftRefreshRef.current) {
      tableSoftRefreshRef.current()
      pendingRealtimeRefreshRef.current = false
    } else {
      pendingRealtimeRefreshRef.current = true
    }
  }, [cacheVersion])

  // Set initialData vào React Query cache để socket bridge có thể cập nhật
  useEffect(() => {
    if (!initialData) return

    const params: AdminRolesListParams = {
      status: "active",
      page: initialData.page,
      limit: initialData.limit,
      search: undefined,
      filters: undefined,
    }
    const queryKey = queryKeys.adminRoles.list(params)
    queryClient.setQueryData(queryKey, initialData)

    logger.debug("Set initial data to cache", {
      queryKey: queryKey.slice(0, 2),
      rowsCount: initialData.rows.length,
      total: initialData.total,
    })
  }, [initialData, queryClient])

  const viewModes = useMemo<ResourceViewMode<RoleRow>[]>(() => {
    const modes: ResourceViewMode<RoleRow>[] = [
      {
        id: "active",
        label: ROLE_LABELS.ACTIVE_VIEW,
        status: "active",
        selectionEnabled: canDelete,
        selectionActions: canDelete
          ? ({ selectedIds, selectedRows, clearSelection, refresh }) => {
              const deletableRows = selectedRows.filter((row) => row.name !== "super_admin")
              const hasSuperAdmin = selectedRows.some((row) => row.name === "super_admin")

              return (
                <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                  <span>
                    {ROLE_LABELS.SELECTED_ROLES(selectedIds.length)}
                    {hasSuperAdmin && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        {ROLE_LABELS.CANNOT_DELETE_SUPER_ADMIN_HINT}
                      </span>
                    )}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      disabled={bulkState.isProcessing || deletableRows.length === 0}
                      onClick={() =>
                        executeBulk(
                          "delete",
                          deletableRows.map((row) => row.id),
                          refresh,
                          clearSelection,
                        )
                      }
                    >
                      <Trash2 className="mr-2 h-5 w-5" />
                      {ROLE_LABELS.DELETE_SELECTED(deletableRows.length)}
                    </Button>
                    {canManage && (
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        disabled={bulkState.isProcessing || deletableRows.length === 0}
                        onClick={() =>
                          executeBulk(
                            "hard-delete",
                            deletableRows.map((row) => row.id),
                            refresh,
                            clearSelection,
                          )
                        }
                      >
                        <AlertTriangle className="mr-2 h-5 w-5" />
                        {ROLE_LABELS.HARD_DELETE_SELECTED(deletableRows.length)}
                      </Button>
                    )}
                    <Button type="button" size="sm" variant="ghost" onClick={clearSelection}>
                      {ROLE_LABELS.CLEAR_SELECTION}
                    </Button>
                  </div>
                </div>
              )
            }
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
          ? ({ selectedIds, selectedRows, clearSelection, refresh }) => {
              const deletableRows = selectedRows.filter((row) => row.name !== "super_admin")
              const hasSuperAdmin = selectedRows.some((row) => row.name === "super_admin")

              return (
                <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                  <span>
                    {ROLE_LABELS.SELECTED_DELETED_ROLES(selectedIds.length)}
                    {hasSuperAdmin && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        {ROLE_LABELS.CANNOT_HARD_DELETE_SUPER_ADMIN_HINT}
                      </span>
                    )}
                  </span>
                  <div className="flex items-center gap-2">
                    {canRestore && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={bulkState.isProcessing || selectedIds.length === 0}
                        onClick={() => executeBulk("restore", selectedIds, refresh, clearSelection)}
                      >
                        <RotateCcw className="mr-2 h-5 w-5" />
                        {ROLE_LABELS.RESTORE_SELECTED(selectedIds.length)}
                      </Button>
                    )}
                    {canManage && (
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        disabled={bulkState.isProcessing || deletableRows.length === 0}
                        onClick={() =>
                          executeBulk(
                            "hard-delete",
                            deletableRows.map((row) => row.id),
                            refresh,
                            clearSelection,
                          )
                        }
                      >
                        <AlertTriangle className="mr-2 h-5 w-5" />
                        {ROLE_LABELS.HARD_DELETE_SELECTED(deletableRows.length)}
                      </Button>
                    )}
                    <Button type="button" size="sm" variant="ghost" onClick={clearSelection}>
                      {ROLE_LABELS.CLEAR_SELECTION}
                    </Button>
                  </div>
                </div>
              )
            }
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

  const router = useResourceRouter()

  const headerActions = canCreate ? (
    <Button
      type="button"
      size="sm"
      onClick={() => router.push("/admin/roles/new")}
      className="h-8 px-3 text-xs sm:text-sm"
    >
      <Plus className="mr-2 h-5 w-5" />
      {ROLE_LABELS.ADD_NEW}
    </Button>
  ) : undefined

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
        onRefreshReady={(refresh) => {
          const wrapped = () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.adminRoles.all(), refetchType: "none" })
            refresh()
          }
          tableSoftRefreshRef.current = refresh
          tableRefreshRef.current = wrapped

          if (pendingRealtimeRefreshRef.current) {
            pendingRealtimeRefreshRef.current = false
            refresh()
          }
        }}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteConfirm?.open ?? false}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteConfirm(null)
          }
        }}
        title={
          deleteConfirm?.type === "hard"
            ? ROLE_CONFIRM_MESSAGES.HARD_DELETE_TITLE(deleteConfirm?.bulkIds?.length)
            : deleteConfirm?.type === "restore"
            ? ROLE_CONFIRM_MESSAGES.RESTORE_TITLE(deleteConfirm?.bulkIds?.length)
            : ROLE_CONFIRM_MESSAGES.DELETE_TITLE(deleteConfirm?.bulkIds?.length)
        }
        description={
          deleteConfirm?.type === "hard"
            ? ROLE_CONFIRM_MESSAGES.HARD_DELETE_DESCRIPTION(
                deleteConfirm?.bulkIds?.length,
                deleteConfirm?.row?.displayName,
              )
            : deleteConfirm?.type === "restore"
            ? ROLE_CONFIRM_MESSAGES.RESTORE_DESCRIPTION(
                deleteConfirm?.bulkIds?.length,
                deleteConfirm?.row?.displayName,
              )
            : ROLE_CONFIRM_MESSAGES.DELETE_DESCRIPTION(
                deleteConfirm?.bulkIds?.length,
                deleteConfirm?.row?.displayName,
              )
        }
        confirmLabel={
          deleteConfirm?.type === "hard"
            ? ROLE_CONFIRM_MESSAGES.HARD_DELETE_LABEL
            : deleteConfirm?.type === "restore"
            ? ROLE_CONFIRM_MESSAGES.RESTORE_LABEL
            : ROLE_CONFIRM_MESSAGES.CONFIRM_LABEL
        }
        cancelLabel={ROLE_CONFIRM_MESSAGES.CANCEL_LABEL}
        variant={deleteConfirm?.type === "hard" ? "destructive" : deleteConfirm?.type === "restore" ? "default" : "destructive"}
        onConfirm={handleDeleteConfirm}
        isLoading={
          bulkState.isProcessing ||
          (deleteConfirm?.row
            ? deleteConfirm.type === "restore"
              ? restoringRoles.has(deleteConfirm.row.id)
              : deleteConfirm.type === "hard"
              ? hardDeletingRoles.has(deleteConfirm.row.id)
              : deletingRoles.has(deleteConfirm.row.id)
            : false)
        }
      />

      {/* Feedback Dialog */}
        <FeedbackDialog
        open={feedback?.open ?? false}
          onOpenChange={handleFeedbackOpenChange}
        variant={feedback?.variant ?? "success"}
        title={feedback?.title ?? ""}
        description={feedback?.description}
        details={feedback?.details}
      />
    </>
  )
}
