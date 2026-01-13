"use client"

import { useCallback, useMemo, useState } from "react"
import { useResourceRouter } from "@/hooks"
import { Plus, RotateCcw, Trash2, AlertTriangle, CheckCircle, XCircle } from "lucide-react"
import { logger } from "@/utils"
import { usePageLoadLogger } from "@/hooks"

import { ConfirmDialog } from "@/components/dialogs"
import type { DataTableQueryState, DataTableResult } from "@/components/tables"
import { FeedbackDialog } from "@/components/dialogs"
import { Button } from "@/components/ui/button"
import {
  ResourceTableClient,
  SelectionActionsWrapper,
} from "@/features/admin/resources/components"
import type { ResourceViewMode } from "@/features/admin/resources/types"
import {
  useResourceTableLoader,
  useResourceTableRefresh,
  useResourceTableLogger,
} from "@/features/admin/resources/hooks"
import { normalizeSearch, sanitizeFilters } from "@/features/admin/resources/utils"
import { apiClient } from "@/services/api/axios"
import { apiRoutes } from "@/constants"
import { useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "@/constants"
import { useUsersSocketBridge } from "@/features/admin/users/hooks/use-users-socket-bridge"
import { useUserActions } from "@/features/admin/users/hooks/use-user-actions"
import { useUserFeedback } from "@/features/admin/users/hooks/use-user-feedback"
import { useUserDeleteConfirm } from "@/features/admin/users/hooks/use-user-delete-confirm"
import { useUserColumns } from "@/features/admin/users/utils/columns"
import { useUserRowActions } from "@/features/admin/users/utils/row-actions"
import { resourceLogger } from "@/utils"
import { TypographySpanSmall, TypographySpanSmallMuted, IconSize } from "@/components/ui/typography"

import type { AdminUsersListParams } from "@/constants"
import type { UserRow, UsersResponse, UsersTableClientProps } from "../types"
import { USER_CONFIRM_MESSAGES, USER_LABELS, PROTECTED_SUPER_ADMIN_EMAIL } from "../constants"
import { Flex } from "@/components/ui/flex"
export const UsersTableClient = ({
  canDelete = false,
  canRestore = false,
  canManage = false,
  canCreate = false,
  initialData,
  initialRolesOptions = [],
}: UsersTableClientProps) => {
  const queryClient = useQueryClient()
  const router = useResourceRouter()

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

  const fetchUsers = useCallback(
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
    }): Promise<DataTableResult<UserRow>> => {
      const baseUrl = apiRoutes.users.list({
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

      const response = await apiClient.get<UsersResponse>(url)
      const payload = response.data

      if (!payload || !payload.data) {
        throw new Error("Không thể tải danh sách người dùng")
      }

      // payload.data là object { data: [...], pagination: {...} }
      const usersData = payload.data.data || []
      const pagination = payload.data.pagination

      return {
        rows: usersData,
        page: pagination?.page ?? page,
        limit: pagination?.limit ?? limit,
        total: pagination?.total ?? 0,
        totalPages: pagination?.totalPages ?? 0,
      }
    },
    [],
  )

  const buildListParams = useCallback(
    ({ query, view }: { query: DataTableQueryState; view: ResourceViewMode<UserRow> }): AdminUsersListParams => {
      const filtersRecord = sanitizeFilters(query.filters)

      return {
        status: (view.status ?? "active") as AdminUsersListParams["status"],
        page: query.page,
        limit: query.limit,
        search: normalizeSearch(query.search),
        filters: Object.keys(filtersRecord).length ? filtersRecord : undefined,
      }
    },
    [],
  )

  const fetchUsersWithDefaults = useCallback(
    (params: AdminUsersListParams) =>
      fetchUsers({
        page: params.page,
        limit: params.limit,
        status: params.status ?? "active",
        search: params.search,
        filters: params.filters,
      }),
    [fetchUsers],
  )

  const loader = useResourceTableLoader<UserRow, AdminUsersListParams>({
    queryClient,
    fetcher: fetchUsersWithDefaults,
    buildParams: buildListParams,
    buildQueryKey: queryKeys.adminUsers.list,
  })

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

      if (action === "delete" || action === "restore" || action === "hard-delete" || action === "active" || action === "unactive") {
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
      } else {
        executeBulkAction(action, ids, refresh, clearSelection, selectedRows)
      }
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
          ? ({ selectedIds, selectedRows, clearSelection, refresh }) => {
            const deletableRows = selectedRows.filter((row) => row.email !== PROTECTED_SUPER_ADMIN_EMAIL)
            const hasSuperAdmin = selectedRows.some((row) => row.email === PROTECTED_SUPER_ADMIN_EMAIL)

            return (
              <Flex direction="col" align="start" justify="between" gap={3} className="sm:flex-row sm:items-center">
                <Flex direction="col" gap={1} className="flex-shrink-0 sm:flex-row sm:items-center">
                  <TypographySpanSmall>
                    {USER_LABELS.SELECTED_USERS(selectedIds.length)}
                  </TypographySpanSmall>
                  {hasSuperAdmin && (
                    <TypographySpanSmallMuted className="sm:ml-2">
                      (Tài khoản super admin không thể xóa)
                    </TypographySpanSmallMuted>
                  )}
                </Flex>
                <Flex align="center" gap={2} wrap>
                  {canManage && (
                    <>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={bulkState.isProcessing || selectedIds.length === 0}
                        onClick={() => executeBulk("active", selectedIds, selectedRows, refresh, clearSelection)}
                        className="whitespace-nowrap border-green-500 text-green-600 hover:bg-green-50 hover:text-green-700 gap-2"
                      >
                        <IconSize size="md">
                          <CheckCircle />
                        </IconSize>
                        <span className="hidden sm:inline">
                          {USER_LABELS.ACTIVE_SELECTED(selectedIds.length)}
                        </span>
                        <span className="sm:hidden">Kích hoạt</span>
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={bulkState.isProcessing || deletableRows.length === 0}
                        onClick={() => executeBulk("unactive", deletableRows.map((r) => r.id), deletableRows, refresh, clearSelection)}
                        className="whitespace-nowrap border-orange-500 text-orange-600 hover:bg-orange-50 hover:text-orange-700 gap-2"
                      >
                        <IconSize size="md">
                          <XCircle />
                        </IconSize>
                        <span>
                          {USER_LABELS.UNACTIVE_SELECTED(deletableRows.length)}
                        </span>
                      </Button>
                    </>
                  )}
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    disabled={bulkState.isProcessing || deletableRows.length === 0}
                    onClick={() => executeBulk("delete", deletableRows.map((r) => r.id), deletableRows, refresh, clearSelection)}
                    className="whitespace-nowrap gap-2"
                  >
                    <IconSize size="md">
                      <Trash2 />
                    </IconSize>
                    <span>
                      {USER_LABELS.DELETE_SELECTED(deletableRows.length)}
                    </span>
                  </Button>
                  {canManage && (
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      disabled={bulkState.isProcessing || deletableRows.length === 0}
                      onClick={() => executeBulk("hard-delete", deletableRows.map((r) => r.id), deletableRows, refresh, clearSelection)}
                      className="whitespace-nowrap gap-2"
                    >
                      <IconSize size="md">
                        <AlertTriangle />
                      </IconSize>
                      <span>
                        {USER_LABELS.HARD_DELETE_SELECTED(deletableRows.length)}
                      </span>
                    </Button>
                  )}
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={clearSelection}
                    className="whitespace-nowrap"
                  >
                    {USER_LABELS.CLEAR_SELECTION}
                  </Button>
                </Flex>
              </Flex>
            )
          }
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
          ? ({ selectedIds, selectedRows, clearSelection, refresh }) => (
            <SelectionActionsWrapper
              label={USER_LABELS.SELECTED_DELETED_USERS(selectedIds.length)}
              actions={
                <>
                  {canRestore && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={bulkState.isProcessing || selectedIds.length === 0}
                      onClick={() => executeBulk("restore", selectedIds, selectedRows, refresh, clearSelection)}
                      className="whitespace-nowrap gap-2"
                    >
                      <IconSize size="md">
                        <RotateCcw />
                      </IconSize>
                      <span>
                        {USER_LABELS.RESTORE_SELECTED(selectedIds.length)}
                      </span>
                    </Button>
                  )}
                  {canManage && (
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      disabled={bulkState.isProcessing || selectedIds.length === 0}
                      onClick={() => executeBulk("hard-delete", selectedIds, selectedRows, refresh, clearSelection)}
                      className="whitespace-nowrap gap-2"
                    >
                      <IconSize size="md">
                        <AlertTriangle />
                      </IconSize>
                      <span>
                        {USER_LABELS.HARD_DELETE_SELECTED(selectedIds.length)}
                      </span>
                    </Button>
                  )}
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={clearSelection}
                    className="whitespace-nowrap"
                  >
                    {USER_LABELS.CLEAR_SELECTION}
                  </Button>
                </>
              }
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

  const getDeleteConfirmTitle = () => {
    if (!deleteConfirm) return ""
    if (deleteConfirm.type === "hard") {
      return USER_CONFIRM_MESSAGES.HARD_DELETE_TITLE(
        deleteConfirm.bulkIds?.length,
      )
    }
    if (deleteConfirm.type === "restore") {
      return USER_CONFIRM_MESSAGES.RESTORE_TITLE(
        deleteConfirm.bulkIds?.length,
      )
    }
    if (deleteConfirm.type === "active") {
      return USER_CONFIRM_MESSAGES.ACTIVE_TITLE(
        deleteConfirm.bulkIds?.length,
      )
    }
    if (deleteConfirm.type === "unactive") {
      return USER_CONFIRM_MESSAGES.UNACTIVE_TITLE(
        deleteConfirm.bulkIds?.length,
      )
    }
    return USER_CONFIRM_MESSAGES.DELETE_TITLE(deleteConfirm.bulkIds?.length)
  }

  const getDeleteConfirmDescription = () => {
    if (!deleteConfirm) return ""
    if (deleteConfirm.type === "hard") {
      return USER_CONFIRM_MESSAGES.HARD_DELETE_DESCRIPTION(
        deleteConfirm.bulkIds?.length,
        deleteConfirm.row?.email,
      )
    }
    if (deleteConfirm.type === "restore") {
      return USER_CONFIRM_MESSAGES.RESTORE_DESCRIPTION(
        deleteConfirm.bulkIds?.length,
        deleteConfirm.row?.email,
      )
    }
    if (deleteConfirm.type === "active") {
      return USER_CONFIRM_MESSAGES.ACTIVE_DESCRIPTION(
        deleteConfirm.bulkIds?.length,
      )
    }
    if (deleteConfirm.type === "unactive") {
      return USER_CONFIRM_MESSAGES.UNACTIVE_DESCRIPTION(
        deleteConfirm.bulkIds?.length,
      )
    }
    return USER_CONFIRM_MESSAGES.DELETE_DESCRIPTION(
      deleteConfirm.bulkIds?.length,
      deleteConfirm.row?.email,
    )
  }

  const headerActions = canCreate ? (
    <Button
      type="button"
      size="sm"
      onClick={() => {
        logger.info("➕ Create new from table header", {
          source: "table-header-create-new",
          resourceName: "users",
          targetUrl: "/admin/users/new",
        })
        router.push("/admin/users/new")
      }}
      className="h-8 px-3"
    >
      <Flex align="center" gap={2}>
        <IconSize size="md">
          <Plus />
        </IconSize>
        {USER_LABELS.ADD_NEW}
      </Flex>
    </Button>
  ) : undefined

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

      {/* Delete Confirmation Dialog */}
      {deleteConfirm && (
        <ConfirmDialog
          open={deleteConfirm.open}
          onOpenChange={(open) => {
            if (!open) setDeleteConfirm(null)
          }}
          title={getDeleteConfirmTitle()}
          description={getDeleteConfirmDescription()}
          variant={
            deleteConfirm.type === "hard"
              ? "destructive"
              : deleteConfirm.type === "restore" || deleteConfirm.type === "active"
                ? "default"
                : deleteConfirm.type === "unactive"
                  ? "default"
                  : "destructive"
          }
          confirmLabel={
            deleteConfirm.type === "hard"
              ? USER_CONFIRM_MESSAGES.HARD_DELETE_LABEL
              : deleteConfirm.type === "restore"
                ? USER_CONFIRM_MESSAGES.RESTORE_LABEL
                : deleteConfirm.type === "active"
                  ? USER_CONFIRM_MESSAGES.ACTIVE_LABEL
                  : deleteConfirm.type === "unactive"
                    ? USER_CONFIRM_MESSAGES.UNACTIVE_LABEL
                    : USER_CONFIRM_MESSAGES.CONFIRM_LABEL
          }
          cancelLabel={USER_CONFIRM_MESSAGES.CANCEL_LABEL}
          onConfirm={handleDeleteConfirm}
          isLoading={
            bulkState.isProcessing ||
            (deleteConfirm.row
              ? deleteConfirm.type === "restore"
                ? restoringIds.has(deleteConfirm.row.id)
                : deleteConfirm.type === "hard"
                  ? hardDeletingIds.has(deleteConfirm.row.id)
                  : deletingIds.has(deleteConfirm.row.id)
              : false)
          }
        />
      )}

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


