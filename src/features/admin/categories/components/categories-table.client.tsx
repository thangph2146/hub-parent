"use client"

import { IconSize, TypographySpanSmall } from "@/components/ui/typography"
import { Flex } from "@/components/ui/flex"

import { useCallback, useMemo, useState } from "react"
import { useResourceRouter } from "@/hooks"
import { Plus, RotateCcw, Trash2, AlertTriangle } from "lucide-react"

import { ConfirmDialog } from "@/components/dialogs"
import type { DataTableQueryState, DataTableResult, DataTableTreeConfig } from "@/components/tables"
import { FeedbackDialog } from "@/components/dialogs"
import { Button } from "@/components/ui/button"
import {
  ResourceTableClient,
  SelectionActionsWrapper,
} from "@/features/admin/resources/components"
import type { ResourceViewMode } from "@/features/admin/resources/types"
import { useResourceNavigation, useResourceTableLoader, useResourceTableRefresh, useResourceTableLogger } from "@/features/admin/resources/hooks"
import { normalizeSearch, sanitizeFilters } from "@/features/admin/resources/utils"
import { apiClient } from "@/services/api/axios"
import { apiRoutes } from "@/constants"
import { useQueryClient } from "@tanstack/react-query"
import { queryKeys, type AdminCategoriesListParams } from "@/constants"
import { resourceLogger } from "@/utils"
import { useCategoriesSocketBridge } from "../hooks/use-categories-socket-bridge"
import { useCategoryActions } from "../hooks/use-category-actions"
import { useCategoryFeedback } from "../hooks/use-category-feedback"
import { useCategoryDeleteConfirm } from "../hooks/use-category-delete-confirm"
import { useCategoryColumns } from "../utils/columns"
import { useCategoryRowActions } from "../utils/row-actions"

import type { CategoryRow, CategoriesResponse, CategoriesTableClientProps } from "../types"
import { CATEGORY_CONFIRM_MESSAGES, CATEGORY_LABELS } from "../constants/messages"
export const CategoriesTableClient = ({
  canDelete = false,
  canRestore = false,
  canManage = false,
  canCreate = false,
  initialData,
}: CategoriesTableClientProps) => {
  const { navigate, router } = useResourceNavigation()
  const queryClient = useQueryClient()
  const { feedback, showFeedback, handleFeedbackOpenChange } = useCategoryFeedback()
  const { deleteConfirm, setDeleteConfirm, handleDeleteConfirm } = useCategoryDeleteConfirm()

  const { cacheVersion, isSocketConnected } = useCategoriesSocketBridge()

  const [currentViewId, setCurrentViewId] = useState<string>("active")

  useResourceTableLogger<CategoryRow>({
    resourceName: "categories",
    initialData,
    initialDataByView: initialData ? { active: initialData } : undefined,
    currentViewId,
    queryClient,
    buildQueryKey: (params) => queryKeys.adminCategories.list({
      ...params,
      status: params.status === "inactive" ? "active" : params.status,
      search: undefined,
      filters: undefined,
    }),
    columns: ["id", "name", "slug", "parentId", "parentName", "description", "createdAt", "deletedAt"],
    getRowData: (row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      parentId: row.parentId,
      parentName: row.parentName,
      description: row.description,
      createdAt: row.createdAt,
      deletedAt: row.deletedAt,
    }),
    cacheVersion,
  })
  const getInvalidateQueryKey = useCallback(() => queryKeys.adminCategories.all(), [])
  const { onRefreshReady, refresh: _refreshTable } = useResourceTableRefresh({
    queryClient,
    getInvalidateQueryKey,
    cacheVersion,
  })

  const {
    executeSingleAction,
    executeBulkAction,
    deletingIds: deletingCategories,
    restoringIds: restoringCategories,
    hardDeletingIds: hardDeletingCategories,
    bulkState,
  } = useCategoryActions({
    canDelete,
    canRestore,
    canManage,
    isSocketConnected,
    showFeedback,
  })

  const { baseColumns, deletedColumns } = useCategoryColumns()

  const handleDeleteSingle = useCallback(
    (row: CategoryRow) => {
      if (!canDelete) return
      resourceLogger.logAction({
        resource: "categories",
        action: "delete",
        resourceId: row.id,
        categoryName: row.name,
      })
      setDeleteConfirm({
        open: true,
        type: "soft",
        row,
        onConfirm: async () => {
          await executeSingleAction("delete", row)
        },
      })
    },
    [canDelete, executeSingleAction, setDeleteConfirm],
  )

  const handleHardDeleteSingle = useCallback(
    (row: CategoryRow) => {
      if (!canManage) return
      resourceLogger.logAction({
        resource: "categories",
        action: "hard-delete",
        resourceId: row.id,
        categoryName: row.name,
      })
      setDeleteConfirm({
        open: true,
        type: "hard",
        row,
        onConfirm: async () => {
          await executeSingleAction("hard-delete", row)
        },
      })
    },
    [canManage, executeSingleAction, setDeleteConfirm],
  )

  const handleRestoreSingle = useCallback(
    (row: CategoryRow) => {
      if (!canRestore) return
      resourceLogger.logAction({
        resource: "categories",
        action: "restore",
        resourceId: row.id,
        categoryName: row.name,
      })
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

  const { renderActiveRowActions, renderDeletedRowActions } = useCategoryRowActions({
    canDelete,
    canRestore,
    canManage,
    onDelete: handleDeleteSingle,
    onHardDelete: handleHardDeleteSingle,
    onRestore: handleRestoreSingle,
    deletingCategories,
    restoringCategories,
    hardDeletingCategories,
  })

  const fetchCategories = useCallback(
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
    }): Promise<DataTableResult<CategoryRow>> => {
      const baseUrl = apiRoutes.categories.list({
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

      const response = await apiClient.get<{
        success: boolean
        data?: CategoriesResponse
        error?: string
        message?: string
      }>(url)

      const payload = response.data.data
      if (!payload) {
        throw new Error(response.data.error || response.data.message || "Không thể tải danh sách danh mục")
      }

      const rawRows = payload.data ?? []

      // Sắp xếp theo tên trước để khi TableBodyContent xây dựng cây, các anh em cùng cấp sẽ được xếp theo alpha
      const sortedRows = [...rawRows].sort((a, b) => a.name.localeCompare(b.name))

      return {
        rows: sortedRows,
        page: payload.pagination?.page ?? page,
        limit: payload.pagination?.limit ?? limit,
        total: payload.pagination?.total ?? rawRows.length,
        totalPages: payload.pagination?.totalPages ?? 0,
      }
    },
    [],
  )

  const buildListParams = useCallback(
    ({ query, view }: { query: DataTableQueryState; view: ResourceViewMode<CategoryRow> }): AdminCategoriesListParams => {
      const filtersRecord = sanitizeFilters(query.filters)

      return {
        status: (view.status ?? "active") as AdminCategoriesListParams["status"],
        page: query.page,
        // Tăng limit cho categories để hiển thị cây chuẩn hơn (thường danh mục không quá nhiều)
        limit: query.limit < 100 ? 1000 : query.limit,
        search: normalizeSearch(query.search),
        filters: Object.keys(filtersRecord).length ? filtersRecord : undefined,
      }
    },
    [],
  )

  const fetchCategoriesWithDefaults = useCallback(
    (params: AdminCategoriesListParams) =>
      fetchCategories({
        page: params.page,
        limit: params.limit,
        status: params.status ?? "active",
        search: params.search,
        filters: params.filters,
      }),
    [fetchCategories],
  )

  const loader = useResourceTableLoader<CategoryRow, AdminCategoriesListParams>({
    queryClient,
    fetcher: fetchCategoriesWithDefaults,
    buildParams: buildListParams,
    buildQueryKey: queryKeys.adminCategories.list,
  })

  const executeBulk = useCallback(
    (action: "delete" | "restore" | "hard-delete", ids: string[], refresh: () => void, clearSelection: () => void, rows: CategoryRow[]) => {
      if (ids.length === 0) return

      resourceLogger.logAction({
        resource: "categories",
        action: action === "delete" ? "bulk-delete" : action === "restore" ? "bulk-restore" : "bulk-hard-delete",
        count: ids.length,
        categoryIds: ids,
      })

      if (action === "delete" || action === "restore" || action === "hard-delete") {
        setDeleteConfirm({
          open: true,
          type: action === "hard-delete" ? "hard" : action === "restore" ? "restore" : "soft",
          bulkIds: ids,
          onConfirm: async () => {
            await executeBulkAction(action, ids, refresh, clearSelection, rows)
          },
        })
      } else {
        executeBulkAction(action, ids, refresh, clearSelection, rows)
      }
    },
    [executeBulkAction, setDeleteConfirm],
  )


  const createActiveSelectionActions = useCallback(
    ({
      selectedIds,
      selectedRows,
      clearSelection,
      refresh,
    }: {
      selectedIds: string[]
      selectedRows: CategoryRow[]
      clearSelection: () => void
      refresh: () => void
    }) => (
      <SelectionActionsWrapper
        label={CATEGORY_LABELS.SELECTED_CATEGORIES(selectedIds.length)}
        actions={
          <>
            {canDelete && (
              <Button
                type="button"
                size="sm"
                variant="destructive"
                disabled={bulkState.isProcessing || selectedIds.length === 0}
                onClick={() => executeBulk("delete", selectedIds, refresh, clearSelection, selectedRows)}
                className="whitespace-nowrap"
              >
                <Flex align="center" gap={2}>
                  <IconSize size="md">
                    <Trash2 />
                  </IconSize>
                  <TypographySpanSmall className="hidden sm:inline">
                    {CATEGORY_LABELS.DELETE_SELECTED(selectedIds.length)}
                  </TypographySpanSmall>
                  <TypographySpanSmall className="sm:hidden">Xóa</TypographySpanSmall>
                </Flex>
              </Button>
            )}
            {canManage && (
              <Button
                type="button"
                size="sm"
                variant="destructive"
                disabled={bulkState.isProcessing || selectedIds.length === 0}
                onClick={() => executeBulk("hard-delete", selectedIds, refresh, clearSelection, selectedRows)}
                className="whitespace-nowrap"
              >
                <Flex align="center" gap={2}>
                  <IconSize size="md">
                    <AlertTriangle />
                  </IconSize>
                  <TypographySpanSmall className="hidden sm:inline">
                    {CATEGORY_LABELS.HARD_DELETE_SELECTED(selectedIds.length)}
                  </TypographySpanSmall>
                  <TypographySpanSmall className="sm:hidden">Xóa vĩnh viễn</TypographySpanSmall>
                </Flex>
              </Button>
            )}
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={clearSelection}
              className="whitespace-nowrap"
            >
              {CATEGORY_LABELS.CLEAR_SELECTION}
            </Button>
          </>
        }
      />
    ),
    [canDelete, canManage, bulkState.isProcessing, executeBulk],
  )

  const createDeletedSelectionActions = useCallback(
    ({
      selectedIds,
      selectedRows,
      clearSelection,
      refresh,
    }: {
      selectedIds: string[]
      selectedRows: CategoryRow[]
      clearSelection: () => void
      refresh: () => void
    }) => (
      <SelectionActionsWrapper
        label={CATEGORY_LABELS.SELECTED_DELETED_CATEGORIES(selectedIds.length)}
        actions={
          <>
            {canRestore && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={bulkState.isProcessing || selectedIds.length === 0}
                onClick={() => executeBulk("restore", selectedIds, refresh, clearSelection, selectedRows)}
                className="whitespace-nowrap"
              >
                <Flex align="center" gap={2}>
                  <IconSize size="md">
                    <RotateCcw />
                  </IconSize>
                  <TypographySpanSmall className="hidden sm:inline">
                    {CATEGORY_LABELS.RESTORE_SELECTED(selectedIds.length)}
                  </TypographySpanSmall>
                  <TypographySpanSmall className="sm:hidden">Khôi phục</TypographySpanSmall>
                </Flex>
              </Button>
            )}
            {canManage && (
              <Button
                type="button"
                size="sm"
                variant="destructive"
                disabled={bulkState.isProcessing || selectedIds.length === 0}
                onClick={() => executeBulk("hard-delete", selectedIds, refresh, clearSelection, selectedRows)}
                className="whitespace-nowrap"
              >
                <Flex align="center" gap={2}>
                  <IconSize size="md">
                    <AlertTriangle />
                  </IconSize>
                  <TypographySpanSmall className="hidden sm:inline">
                    {CATEGORY_LABELS.HARD_DELETE_SELECTED(selectedIds.length)}
                  </TypographySpanSmall>
                  <TypographySpanSmall className="sm:hidden">Xóa vĩnh viễn</TypographySpanSmall>
                </Flex>
              </Button>
            )}
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={clearSelection}
              className="whitespace-nowrap"
            >
              {CATEGORY_LABELS.CLEAR_SELECTION}
            </Button>
          </>
        }
      />
    ),
    [canRestore, canManage, bulkState.isProcessing, executeBulk],
  )

  const viewModes = useMemo<ResourceViewMode<CategoryRow>[]>(() => {
    const modes: ResourceViewMode<CategoryRow>[] = [
      {
        id: "active",
        label: CATEGORY_LABELS.ACTIVE_VIEW,
        status: "active",
        columns: baseColumns,
        selectionEnabled: canDelete || canManage,
        selectionActions: canDelete || canManage ? createActiveSelectionActions : undefined,
        rowActions: (row) => renderActiveRowActions(row),
        emptyMessage: CATEGORY_LABELS.NO_CATEGORIES,
      },
      {
        id: "deleted",
        label: CATEGORY_LABELS.DELETED_VIEW,
        status: "deleted",
        columns: deletedColumns,
        selectionEnabled: canRestore || canManage,
        selectionActions: canRestore || canManage ? createDeletedSelectionActions : undefined,
        rowActions: (row) => renderDeletedRowActions(row),
        emptyMessage: CATEGORY_LABELS.NO_DELETED_CATEGORIES,
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
      return CATEGORY_CONFIRM_MESSAGES.HARD_DELETE_TITLE(
        deleteConfirm.bulkIds?.length,
      )
    }
    if (deleteConfirm.type === "restore") {
      return CATEGORY_CONFIRM_MESSAGES.RESTORE_TITLE(
        deleteConfirm.bulkIds?.length,
      )
    }
    return CATEGORY_CONFIRM_MESSAGES.DELETE_TITLE(deleteConfirm.bulkIds?.length)
  }

  const getDeleteConfirmDescription = () => {
    if (!deleteConfirm) return ""
    if (deleteConfirm.type === "hard") {
      return CATEGORY_CONFIRM_MESSAGES.HARD_DELETE_DESCRIPTION(
        deleteConfirm.bulkIds?.length,
        deleteConfirm.row?.name,
      )
    }
    if (deleteConfirm.type === "restore") {
      return CATEGORY_CONFIRM_MESSAGES.RESTORE_DESCRIPTION(
        deleteConfirm.bulkIds?.length,
        deleteConfirm.row?.name,
      )
    }
    return CATEGORY_CONFIRM_MESSAGES.DELETE_DESCRIPTION(
      deleteConfirm.bulkIds?.length,
      deleteConfirm.row?.name,
    )
  }

  const headerActions = canCreate ? (
    <Button
      type="button"
      size="sm"
      onClick={() => navigate("/admin/categories/new")}
      className="h-8 px-3"
    >
      <Flex align="center" gap={2}>
        <IconSize size="md">
          <Plus />
        </IconSize>
        {CATEGORY_LABELS.ADD_NEW}
      </Flex>
    </Button>
  ) : undefined

  const treeConfig = useMemo<DataTableTreeConfig<CategoryRow>>(
    () => ({
      parentIdKey: "parentId",
      idKey: "id",
      defaultExpanded: true,
    }),
    [],
  )

  return (
    <>
      <ResourceTableClient<CategoryRow>
        title={CATEGORY_LABELS.MANAGE_CATEGORIES}
        baseColumns={baseColumns}
        loader={loader}
        viewModes={viewModes}
        defaultViewId="active"
        initialDataByView={initialDataByView}
        fallbackRowCount={6}
        headerActions={headerActions}
        onRefreshReady={onRefreshReady}
        onViewChange={setCurrentViewId}
        tree={treeConfig}
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
              ? CATEGORY_CONFIRM_MESSAGES.HARD_DELETE_LABEL
              : deleteConfirm.type === "restore"
              ? CATEGORY_CONFIRM_MESSAGES.RESTORE_LABEL
              : CATEGORY_CONFIRM_MESSAGES.CONFIRM_LABEL
          }
          cancelLabel={CATEGORY_CONFIRM_MESSAGES.CANCEL_LABEL}
          onConfirm={handleDeleteConfirm}
          isLoading={
            bulkState.isProcessing ||
            (deleteConfirm.row
              ? deleteConfirm.type === "restore"
                ? restoringCategories.has(deleteConfirm.row.id)
                : deleteConfirm.type === "hard"
                ? hardDeletingCategories.has(deleteConfirm.row.id)
                : deletingCategories.has(deleteConfirm.row.id)
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

