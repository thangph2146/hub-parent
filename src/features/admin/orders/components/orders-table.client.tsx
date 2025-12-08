"use client"

import { useCallback, useMemo, useState } from "react"
import { RotateCcw, Trash2, AlertTriangle } from "lucide-react"

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
import { apiClient } from "@/lib/api/axios"
import { apiRoutes } from "@/lib/api/routes"
import { useQueryClient } from "@tanstack/react-query"
import { queryKeys, type AdminOrdersListParams } from "@/lib/query-keys"
import { useOrdersSocketBridge } from "../hooks/use-orders-socket-bridge"
import { useOrderActions } from "../hooks/use-order-actions"
import { useOrderFeedback } from "../hooks/use-order-feedback"
import { useOrderDeleteConfirm } from "../hooks/use-order-delete-confirm"
import { useOrderColumns } from "../utils/columns"
import { useOrderRowActions } from "../utils/row-actions"

import type { OrderRow, OrdersResponse, OrdersTableClientProps } from "../types"
import { ORDER_CONFIRM_MESSAGES, ORDER_LABELS } from "../constants/messages"
import { resourceLogger } from "@/lib/config"
import { sanitizeSearchQuery } from "@/lib/api/validation"

export function OrdersTableClient({
  canDelete = false,
  canRestore = false,
  canManage = false,
  canCreate: _canCreate = false,
  initialData,
}: OrdersTableClientProps) {
  const queryClient = useQueryClient()
  const { cacheVersion } = useOrdersSocketBridge()
  const { feedback, showFeedback, handleFeedbackOpenChange } = useOrderFeedback()
  const { deleteConfirm, setDeleteConfirm, handleDeleteConfirm } = useOrderDeleteConfirm()

  const getInvalidateQueryKey = useCallback(() => queryKeys.adminOrders.all(), [])
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
    bulkState,
  } = useOrderActions({
    canDelete,
    canRestore,
    canManage,
    showFeedback,
  })

  const { baseColumns, deletedColumns } = useOrderColumns()

  const handleDeleteSingle = useCallback(
    (row: OrderRow) => {
      setDeleteConfirm({
        open: true,
        type: "soft",
        row,
        onConfirm: async () => {
          await executeSingleAction("delete", row, refreshTable)
        },
      })
    },
    [executeSingleAction, refreshTable, setDeleteConfirm]
  )

  const handleHardDeleteSingle = useCallback(
    (row: OrderRow) => {
      setDeleteConfirm({
        open: true,
        type: "hard",
        row,
        onConfirm: async () => {
          await executeSingleAction("hard-delete", row, refreshTable)
        },
      })
    },
    [executeSingleAction, refreshTable, setDeleteConfirm]
  )

  const handleRestoreSingle = useCallback(
    (row: OrderRow) => {
      setDeleteConfirm({
        open: true,
        type: "restore",
        row,
        onConfirm: async () => {
          await executeSingleAction("restore", row, refreshTable)
        },
      })
    },
    [executeSingleAction, refreshTable, setDeleteConfirm]
  )

  const { renderActiveRowActions, renderDeletedRowActions } = useOrderRowActions({
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

  const fetchOrders = useCallback(
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
    }): Promise<DataTableResult<OrderRow>> => {
      const safePage = Number.isFinite(page) && page > 0 ? page : 1
      const safeLimit = Number.isFinite(limit) && limit > 0 ? limit : 10
      const trimmedSearch = typeof search === "string" ? search.trim() : ""
      const searchValidation =
        trimmedSearch.length > 0 ? sanitizeSearchQuery(trimmedSearch, 200) : { valid: true, value: "" }
      if (!searchValidation.valid) {
        throw new Error(searchValidation.error || "Từ khóa tìm kiếm không hợp lệ. Vui lòng thử lại.")
      }

      const requestParams: Record<string, string> = {
        page: safePage.toString(),
        limit: safeLimit.toString(),
        status: status ?? "active",
      }
      if (searchValidation.value) {
        requestParams.search = searchValidation.value
      }

      Object.entries(filters ?? {}).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          const normalized = `${value}`.trim()
          if (normalized) {
            const filterValidation = sanitizeSearchQuery(normalized, 100)
            if (filterValidation.valid && filterValidation.value) {
              requestParams[`filter[${key}]`] = filterValidation.value
            } else if (!filterValidation.valid) {
              throw new Error(filterValidation.error || "Giá trị bộ lọc không hợp lệ. Vui lòng thử lại.")
            }
          }
        }
      })

      const response = await apiClient.get<OrdersResponse>(apiRoutes.orders.list(), {
        params: requestParams,
      })
      const payload = response.data

      if (!payload || !payload.data) {
        throw new Error("Không thể tải danh sách đơn hàng")
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

  const buildListParams = useCallback(
    ({ query, view }: { query: DataTableQueryState; view: ResourceViewMode<OrderRow> }): AdminOrdersListParams => {
      const filtersRecord = sanitizeFilters(query.filters)
      const normalizedSearch = normalizeSearch(query.search)

      return {
        status: (view.status ?? "active") as AdminOrdersListParams["status"],
        page: query.page,
        limit: query.limit,
        search: normalizedSearch,
        filters: Object.keys(filtersRecord).length ? filtersRecord : undefined,
      }
    },
    [],
  )

  const fetchOrdersWithDefaults = useCallback(
    (params: AdminOrdersListParams) =>
      fetchOrders({
        page: params.page,
        limit: params.limit,
        status: params.status ?? "active",
        search: params.search,
        filters: params.filters,
      }),
    [fetchOrders],
  )

  const loader = useResourceTableLoader<OrderRow, AdminOrdersListParams>({
    queryClient,
    fetcher: fetchOrdersWithDefaults,
    buildParams: buildListParams,
    buildQueryKey: queryKeys.adminOrders.list,
  })

  const executeBulk = useCallback(
    (action: "delete" | "restore" | "hard-delete", ids: string[], refresh: () => void, clearSelection: () => void) => {
      if (ids.length === 0) return

      resourceLogger.tableAction({
        resource: "orders",
        action: action === "delete" ? "bulk-delete" : action === "restore" ? "bulk-restore" : "bulk-hard-delete",
        count: ids.length,
        orderIds: ids,
      })

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

  const createActiveSelectionActions = useCallback(
    ({
      selectedIds,
      clearSelection,
      refresh,
    }: {
      selectedIds: string[]
      clearSelection: () => void
      refresh: () => void
    }) => (
      <SelectionActionsWrapper
        label={ORDER_LABELS.SELECTED_ORDERS(selectedIds.length)}
        actions={
          <>
            {(canManage || canDelete) && (
              <Button
                type="button"
                size="sm"
                variant="destructive"
                disabled={bulkState.isProcessing || selectedIds.length === 0}
                onClick={() => executeBulk("delete", selectedIds, refresh, clearSelection)}
                className="whitespace-nowrap"
              >
                <Trash2 className="mr-2 h-5 w-5 shrink-0" />
                <span className="hidden sm:inline">{ORDER_LABELS.DELETE_SELECTED(selectedIds.length)}</span>
                <span className="sm:hidden">Xóa</span>
              </Button>
            )}
            {canManage && (
              <Button
                type="button"
                size="sm"
                variant="destructive"
                disabled={bulkState.isProcessing || selectedIds.length === 0}
                onClick={() => executeBulk("hard-delete", selectedIds, refresh, clearSelection)}
                className="whitespace-nowrap"
              >
                <AlertTriangle className="mr-2 h-5 w-5 shrink-0" />
                <span className="hidden sm:inline">{ORDER_LABELS.HARD_DELETE_SELECTED(selectedIds.length)}</span>
                <span className="sm:hidden">Xóa vĩnh viễn</span>
              </Button>
            )}
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={clearSelection}
              className="whitespace-nowrap"
            >
              {ORDER_LABELS.CLEAR_SELECTION}
            </Button>
          </>
        }
      />
    ),
    [canManage, canDelete, bulkState.isProcessing, executeBulk],
  )

  const createDeletedSelectionActions = useCallback(
    ({
      selectedIds,
      clearSelection,
      refresh,
    }: {
      selectedIds: string[]
      clearSelection: () => void
      refresh: () => void
    }) => (
      <SelectionActionsWrapper
        label={ORDER_LABELS.SELECTED_DELETED_ORDERS(selectedIds.length)}
        actions={
          <>
            {canRestore && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={bulkState.isProcessing || selectedIds.length === 0}
                onClick={() => executeBulk("restore", selectedIds, refresh, clearSelection)}
                className="whitespace-nowrap"
              >
                <RotateCcw className="mr-2 h-5 w-5 shrink-0" />
                <span className="hidden sm:inline">{ORDER_LABELS.RESTORE_SELECTED(selectedIds.length)}</span>
                <span className="sm:hidden">Khôi phục</span>
              </Button>
            )}
            {canManage && (
              <Button
                type="button"
                size="sm"
                variant="destructive"
                disabled={bulkState.isProcessing || selectedIds.length === 0}
                onClick={() => executeBulk("hard-delete", selectedIds, refresh, clearSelection)}
                className="whitespace-nowrap"
              >
                <AlertTriangle className="mr-2 h-5 w-5 shrink-0" />
                <span className="hidden sm:inline">{ORDER_LABELS.HARD_DELETE_SELECTED(selectedIds.length)}</span>
                <span className="sm:hidden">Xóa vĩnh viễn</span>
              </Button>
            )}
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={clearSelection}
              className="whitespace-nowrap"
            >
              {ORDER_LABELS.CLEAR_SELECTION}
            </Button>
          </>
        }
      />
    ),
    [canRestore, canManage, bulkState.isProcessing, executeBulk],
  )

  const viewModes = useMemo<ResourceViewMode<OrderRow>[]>(() => {
    const modes: ResourceViewMode<OrderRow>[] = [
      {
        id: "active",
        label: ORDER_LABELS.ACTIVE_VIEW,
        status: "active",
        columns: baseColumns,
        selectionEnabled: canManage || canDelete,
        selectionActions: canManage || canDelete ? createActiveSelectionActions : undefined,
        rowActions: (row) => renderActiveRowActions(row),
        emptyMessage: ORDER_LABELS.NO_ORDERS,
      },
      {
        id: "deleted",
        label: ORDER_LABELS.DELETED_VIEW,
        status: "deleted",
        columns: deletedColumns,
        selectionEnabled: canRestore || canManage,
        selectionActions: canRestore || canManage ? createDeletedSelectionActions : undefined,
        rowActions: (row) => renderDeletedRowActions(row),
        emptyMessage: ORDER_LABELS.NO_DELETED_ORDERS,
      },
    ]

    return modes
  }, [
    canDelete,
    canRestore,
    canManage,
    baseColumns,
    deletedColumns,
    createActiveSelectionActions,
    createDeletedSelectionActions,
    renderActiveRowActions,
    renderDeletedRowActions,
  ])

  const initialDataByView = useMemo(
    () => (initialData ? { active: initialData } : undefined),
    [initialData],
  )

  const getDeleteConfirmTitle = () => {
    if (!deleteConfirm) return ""
    if (deleteConfirm.type === "hard") {
      return ORDER_CONFIRM_MESSAGES.HARD_DELETE_TITLE(
        deleteConfirm.bulkIds?.length,
      )
    }
    if (deleteConfirm.type === "restore") {
      return ORDER_CONFIRM_MESSAGES.RESTORE_TITLE(
        deleteConfirm.bulkIds?.length,
      )
    }
    return ORDER_CONFIRM_MESSAGES.DELETE_TITLE(deleteConfirm.bulkIds?.length)
  }

  const getDeleteConfirmDescription = () => {
    if (!deleteConfirm) return ""
    if (deleteConfirm.type === "hard") {
      return ORDER_CONFIRM_MESSAGES.HARD_DELETE_DESCRIPTION(
        deleteConfirm.bulkIds?.length,
        deleteConfirm.row?.orderNumber,
      )
    }
    if (deleteConfirm.type === "restore") {
      return ORDER_CONFIRM_MESSAGES.RESTORE_DESCRIPTION(
        deleteConfirm.bulkIds?.length,
        deleteConfirm.row?.orderNumber,
      )
    }
    return ORDER_CONFIRM_MESSAGES.DELETE_DESCRIPTION(
      deleteConfirm.bulkIds?.length,
      deleteConfirm.row?.orderNumber,
    )
  }

  const [currentViewId, setCurrentViewId] = useState<string>("active")

  useResourceTableLogger<OrderRow>({
    resourceName: "orders",
    initialData,
    initialDataByView: initialData ? { active: initialData } : undefined,
    currentViewId,
    queryClient,
    buildQueryKey: (params) => queryKeys.adminOrders.list({
      ...params,
      search: undefined,
      filters: undefined,
    }),
    columns: ["id", "orderNumber", "customerName", "customerEmail", "status", "paymentStatus", "total", "createdAt", "deletedAt"],
    getRowData: (row) => ({
      id: row.id,
      orderNumber: row.orderNumber,
      customerName: row.customerName,
      customerEmail: row.customerEmail,
      status: row.status,
      paymentStatus: row.paymentStatus,
      total: row.total,
      createdAt: row.createdAt,
      deletedAt: row.deletedAt,
    }),
    cacheVersion,
  })

  return (
    <>
      <ResourceTableClient<OrderRow>
        title={ORDER_LABELS.MANAGE_ORDERS}
        baseColumns={baseColumns}
        loader={loader}
        viewModes={viewModes}
        defaultViewId="active"
        initialDataByView={initialDataByView}
        fallbackRowCount={6}
        headerActions={undefined}
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
          variant={deleteConfirm.type === "hard" ? "destructive" : deleteConfirm.type === "restore" ? "default" : "destructive"}
          confirmLabel={
            deleteConfirm.type === "hard" 
              ? "Xóa vĩnh viễn" 
              : deleteConfirm.type === "restore"
              ? "Khôi phục"
              : "Xóa"
          }
          cancelLabel="Hủy"
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

