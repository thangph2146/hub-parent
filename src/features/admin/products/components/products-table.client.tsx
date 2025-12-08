"use client"

import { useCallback, useMemo, useState } from "react"
import { useResourceRouter } from "@/hooks/use-resource-segment"
import { Plus, RotateCcw, Trash2, AlertTriangle } from "lucide-react"

import { ConfirmDialog } from "@/components/dialogs"
import type { DataTableQueryState, DataTableResult } from "@/components/tables"
import { FeedbackDialog } from "@/components/dialogs"
import { Button } from "@/components/ui/button"
import {
  ResourceTableClient,
  SelectionActionsWrapper,
} from "@/features/admin/resources/components"
import type { ResourceViewMode, ResourceRefreshHandler } from "@/features/admin/resources/types"
import {
  useResourceTableLoader,
  useResourceTableRefresh,
  useResourceTableLogger,
} from "@/features/admin/resources/hooks"
import { normalizeSearch, sanitizeFilters } from "@/features/admin/resources/utils"
import { apiClient } from "@/lib/api/axios"
import { apiRoutes } from "@/lib/api/routes"
import { useQueryClient } from "@tanstack/react-query"
import { queryKeys, type AdminProductsListParams } from "@/lib/query-keys"
import { useProductsSocketBridge } from "../hooks/use-products-socket-bridge"
import { useProductActions } from "../hooks/use-product-actions"
import { useProductFeedback } from "../hooks/use-product-feedback"
import { useProductDeleteConfirm } from "../hooks/use-product-delete-confirm"
import { useProductColumns } from "../utils/columns"
import { useProductRowActions } from "../utils/row-actions"

import type { ProductRow, ProductsResponse, ProductsTableClientProps } from "../types"
import { PRODUCT_CONFIRM_MESSAGES, PRODUCT_LABELS } from "../constants/messages"
import { resourceLogger } from "@/lib/config"
import { sanitizeSearchQuery } from "@/lib/api/validation"

export function ProductsTableClient({
  canDelete = false,
  canRestore = false,
  canManage = false,
  canCreate = false,
  initialData,
}: ProductsTableClientProps) {
  const router = useResourceRouter()
  const queryClient = useQueryClient()
  const { cacheVersion } = useProductsSocketBridge()
  const { feedback, showFeedback, handleFeedbackOpenChange } = useProductFeedback()
  const { deleteConfirm, setDeleteConfirm, handleDeleteConfirm } = useProductDeleteConfirm()
  const [togglingProducts, setTogglingProducts] = useState<Set<string>>(new Set())
  const canToggleStatus = canManage

  const getInvalidateQueryKey = useCallback(() => queryKeys.adminProducts.all(), [])
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
  } = useProductActions({
    canDelete,
    canRestore,
    canManage,
    showFeedback,
  })

  const handleToggleFeatured = useCallback(
    async (row: ProductRow, newStatus: boolean, _refresh: ResourceRefreshHandler) => {
      if (!canToggleStatus) {
        showFeedback("error", "Không có quyền", "Bạn không có quyền thay đổi trạng thái nổi bật")
        return
      }

      resourceLogger.actionFlow({
        resource: "products",
        action: "toggle-status",
        step: "start",
        metadata: { productId: row.id, productName: row.name, newStatus, actionType: newStatus ? "toggle-featured" : "untoggle-featured" },
      })

      setTogglingProducts((prev) => {
        const next = new Set(prev)
        next.add(row.id)
        return next
      })

      try {
        await apiClient.put(apiRoutes.products.update(row.id), {
          featured: newStatus,
        })

        showFeedback(
          "success",
          "Thành công",
          newStatus ? "Đã đánh dấu sản phẩm nổi bật" : "Đã bỏ đánh dấu nổi bật"
        )
        refreshTable()
      } catch (error: unknown) {
        const errorMessage = error instanceof Error && "response" in error && typeof error.response === "object" && error.response !== null && "data" in error.response && typeof error.response.data === "object" && error.response.data !== null && "message" in error.response.data && typeof error.response.data.message === "string" ? error.response.data.message : "Không thể thay đổi trạng thái nổi bật"
        showFeedback(
          "error",
          "Lỗi",
          errorMessage
        )
      } finally {
        setTogglingProducts((prev) => {
          const next = new Set(prev)
          next.delete(row.id)
          return next
        })
      }
    },
    [canToggleStatus, showFeedback, refreshTable]
  )

  const { baseColumns, deletedColumns } = useProductColumns({
    canToggleStatus,
    onToggleFeatured: (row, newStatus) => handleToggleFeatured(row, newStatus, refreshTable),
    togglingProducts,
  })

  const handleDeleteSingle = useCallback(
    (row: ProductRow) => {
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
    (row: ProductRow) => {
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
    (row: ProductRow) => {
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

  const { renderActiveRowActions, renderDeletedRowActions } = useProductRowActions({
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

  const fetchProducts = useCallback(
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
    }): Promise<DataTableResult<ProductRow>> => {
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

      const response = await apiClient.get<ProductsResponse>(apiRoutes.products.list(), {
        params: requestParams,
      })
      const payload = response.data

      if (!payload || !payload.data) {
        throw new Error("Không thể tải danh sách sản phẩm")
      }

      // API trả về { success: true, data: { data: [...], pagination: {...} } }
      const data = payload.data as { data?: ProductRow[]; pagination?: { page?: number; limit?: number; total?: number; totalPages?: number } } | ProductRow[]
      const rows = Array.isArray((data as { data?: ProductRow[] }).data) 
        ? (data as { data: ProductRow[] }).data 
        : (Array.isArray(data) ? data as ProductRow[] : [])
      const pagination = (data as { pagination?: { page?: number; limit?: number; total?: number; totalPages?: number } }).pagination || (payload.pagination as { page?: number; limit?: number; total?: number; totalPages?: number } | undefined)

      return {
        rows,
        page: pagination?.page ?? page,
        limit: pagination?.limit ?? limit,
        total: pagination?.total ?? 0,
        totalPages: pagination?.totalPages ?? 0,
      }
    },
    [],
  )

  const buildListParams = useCallback(
    ({ query, view }: { query: DataTableQueryState; view: ResourceViewMode<ProductRow> }): AdminProductsListParams => {
      const filtersRecord = sanitizeFilters(query.filters)
      const normalizedSearch = normalizeSearch(query.search)

      return {
        status: (view.status ?? "active") as AdminProductsListParams["status"],
        page: query.page,
        limit: query.limit,
        search: normalizedSearch,
        filters: Object.keys(filtersRecord).length ? filtersRecord : undefined,
      }
    },
    [],
  )

  const fetchProductsWithDefaults = useCallback(
    (params: AdminProductsListParams) =>
      fetchProducts({
        page: params.page,
        limit: params.limit,
        status: params.status ?? "active",
        search: params.search,
        filters: params.filters,
      }),
    [fetchProducts],
  )

  const loader = useResourceTableLoader<ProductRow, AdminProductsListParams>({
    queryClient,
    fetcher: fetchProductsWithDefaults,
    buildParams: buildListParams,
    buildQueryKey: queryKeys.adminProducts.list,
  })

  const executeBulk = useCallback(
    (action: "delete" | "restore" | "hard-delete", ids: string[], refresh: () => void, clearSelection: () => void) => {
      if (ids.length === 0) return

      resourceLogger.tableAction({
        resource: "products",
        action: action === "delete" ? "bulk-delete" : action === "restore" ? "bulk-restore" : "bulk-hard-delete",
        count: ids.length,
        productIds: ids,
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
        label={`Đã chọn ${selectedIds.length} sản phẩm`}
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
                <span className="hidden sm:inline">Xóa đã chọn ({selectedIds.length})</span>
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
                <span className="hidden sm:inline">Xóa vĩnh viễn ({selectedIds.length})</span>
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
              Bỏ chọn
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
        label={`Đã chọn ${selectedIds.length} sản phẩm (đã xóa)`}
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
                <span className="hidden sm:inline">Khôi phục ({selectedIds.length})</span>
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
                <span className="hidden sm:inline">Xóa vĩnh viễn ({selectedIds.length})</span>
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
              Bỏ chọn
            </Button>
          </>
        }
      />
    ),
    [canRestore, canManage, bulkState.isProcessing, executeBulk],
  )

  const viewModes = useMemo<ResourceViewMode<ProductRow>[]>(() => {
    const modes: ResourceViewMode<ProductRow>[] = [
      {
        id: "active",
        label: PRODUCT_LABELS.ACTIVE_VIEW,
        status: "active",
        columns: baseColumns,
        selectionEnabled: canManage || canDelete,
        selectionActions: canManage || canDelete ? createActiveSelectionActions : undefined,
        rowActions: (row) => renderActiveRowActions(row),
        emptyMessage: PRODUCT_LABELS.NO_PRODUCTS,
      },
      {
        id: "deleted",
        label: PRODUCT_LABELS.DELETED_VIEW,
        status: "deleted",
        columns: deletedColumns,
        selectionEnabled: canRestore || canManage,
        selectionActions: canRestore || canManage ? createDeletedSelectionActions : undefined,
        rowActions: (row) => renderDeletedRowActions(row),
        emptyMessage: PRODUCT_LABELS.NO_DELETED_PRODUCTS,
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
      return PRODUCT_CONFIRM_MESSAGES.HARD_DELETE_TITLE(
        deleteConfirm.bulkIds?.length,
      )
    }
    if (deleteConfirm.type === "restore") {
      return PRODUCT_CONFIRM_MESSAGES.RESTORE_TITLE(
        deleteConfirm.bulkIds?.length,
      )
    }
    return PRODUCT_CONFIRM_MESSAGES.DELETE_TITLE(deleteConfirm.bulkIds?.length)
  }

  const getDeleteConfirmDescription = () => {
    if (!deleteConfirm) return ""
    if (deleteConfirm.type === "hard") {
      return PRODUCT_CONFIRM_MESSAGES.HARD_DELETE_DESCRIPTION(
        deleteConfirm.bulkIds?.length,
        deleteConfirm.row?.name,
      )
    }
    if (deleteConfirm.type === "restore") {
      return PRODUCT_CONFIRM_MESSAGES.RESTORE_DESCRIPTION(
        deleteConfirm.bulkIds?.length,
        deleteConfirm.row?.name,
      )
    }
    return PRODUCT_CONFIRM_MESSAGES.DELETE_DESCRIPTION(
      deleteConfirm.bulkIds?.length,
      deleteConfirm.row?.name,
    )
  }

  const headerActions = canCreate ? (
    <Button
      type="button"
      size="sm"
      onClick={() => router.push("/admin/products/new")}
      className="h-8 px-3 text-xs sm:text-sm"
    >
      <Plus className="mr-2 h-5 w-5" />
      Thêm mới
    </Button>
  ) : undefined

  const [currentViewId, setCurrentViewId] = useState<string>("active")

  useResourceTableLogger<ProductRow>({
    resourceName: "products",
    initialData,
    initialDataByView: initialData ? { active: initialData } : undefined,
    currentViewId,
    queryClient,
    buildQueryKey: (params) => queryKeys.adminProducts.list({
      ...params,
      search: undefined,
      filters: undefined,
    }),
    columns: ["id", "name", "sku", "price", "stock", "status", "featured", "createdAt", "deletedAt"],
    getRowData: (row) => ({
      id: row.id,
      name: row.name,
      sku: row.sku,
      price: row.price,
      stock: row.stock,
      status: row.status,
      featured: row.featured,
      createdAt: row.createdAt,
      deletedAt: row.deletedAt,
    }),
    cacheVersion,
  })

  return (
    <>
      <ResourceTableClient<ProductRow>
        title="Quản lý sản phẩm"
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

