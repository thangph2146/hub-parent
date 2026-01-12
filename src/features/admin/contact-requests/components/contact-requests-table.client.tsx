"use client"

import { useCallback, useMemo, useState } from "react"
import { RotateCcw, Trash2, AlertTriangle, CheckCircle2, Circle, ChevronDown } from "lucide-react"

import { ConfirmDialog } from "@/components/dialogs"
import type { DataTableQueryState, DataTableResult } from "@/components/tables"
import { FeedbackDialog } from "@/components/dialogs"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { ContactStatus } from "../types"
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
import { useContactRequestsSocketBridge } from "../hooks/use-contact-requests-socket-bridge"
import { useContactRequestActions } from "../hooks/use-contact-request-actions"
import { useContactRequestFeedback } from "../hooks/use-contact-request-feedback"
import { useContactRequestDeleteConfirm } from "../hooks/use-contact-request-delete-confirm"
import { useContactRequestColumns } from "../utils/columns"
import { useContactRequestRowActions } from "../utils/row-actions"

import type { AdminContactRequestsListParams } from "@/constants"
import type { ContactRequestRow, ContactRequestsResponse, ContactRequestsTableClientProps } from "../types"
import { CONTACT_REQUEST_CONFIRM_MESSAGES, CONTACT_REQUEST_LABELS } from "../constants"
export const ContactRequestsTableClient = ({
  canDelete = false,
  canRestore = false,
  canManage = false,
  canUpdate = false,
  canAssign: _canAssign = false,
  initialData,
  initialUsersOptions = [],
}: ContactRequestsTableClientProps) => { 
  const queryClient = useQueryClient()
  const { isSocketConnected, cacheVersion } = useContactRequestsSocketBridge()
  const { feedback, showFeedback, handleFeedbackOpenChange } = useContactRequestFeedback()
  const { deleteConfirm, setDeleteConfirm, handleDeleteConfirm } = useContactRequestDeleteConfirm()

  const [currentViewId, setCurrentViewId] = useState<string>("new")

  const getInvalidateQueryKey = useCallback(() => queryKeys.adminContactRequests.all(), [])
  const { onRefreshReady, refresh: refreshTable } = useResourceTableRefresh({
    queryClient,
    getInvalidateQueryKey,
    cacheVersion,
  })

  const {
    handleToggleRead,
    executeSingleAction,
    executeBulkAction,
    handleBulkMarkRead,
    handleBulkMarkUnread,
    handleBulkUpdateStatus,
    markingReadRequests,
    markingUnreadRequests,
    togglingRequests,
    deletingRequests,
    restoringRequests,
    hardDeletingRequests,
    bulkState,
  } = useContactRequestActions({
    canDelete,
    canRestore,
    canManage,
    canUpdate,
    isSocketConnected,
    showFeedback,
  })

  useResourceTableLogger<ContactRequestRow>({
    resourceName: "contact-requests",
    initialData,
    initialDataByView: initialData ? { new: initialData } : undefined,
    currentViewId,
    queryClient,
    buildQueryKey: (params) => queryKeys.adminContactRequests.list({
      ...params,
      status: params.status === "inactive" ? "active" : params.status,
      search: undefined,
      filters: undefined,
    }),
    columns: ["id", "name", "email", "phone", "subject", "status", "priority", "isRead", "assignedToName", "createdAt", "deletedAt"],
    getRowData: (row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      subject: row.subject,
      status: row.status,
      priority: row.priority,
      isRead: row.isRead,
      assignedToName: row.assignedToName,
      createdAt: row.createdAt,
      deletedAt: row.deletedAt,
    }),
    cacheVersion: bulkState.isProcessing ? undefined : cacheVersion,
  })

  const handleToggleReadWithRefresh = useCallback(
    (row: ContactRequestRow, checked: boolean) => {
      if (!canUpdate) return
      // Thực hiện trực tiếp không cần confirm dialog cho action đơn giản này
      handleToggleRead(row, checked, refreshTable)
    },
    [canUpdate, handleToggleRead, refreshTable],
  )

  const { baseColumns, deletedColumns } = useContactRequestColumns({
    togglingRequests,
    canUpdate,
    initialUsersOptions,
    onToggleRead: handleToggleReadWithRefresh,
  })

  const handleDeleteSingle = useCallback(
    (row: ContactRequestRow) => {
      if (!canDelete) return
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
    (row: ContactRequestRow) => {
      if (!canManage) return
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
    (row: ContactRequestRow) => {
      if (!canRestore) return
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

  const { renderActiveRowActions, renderDeletedRowActions } = useContactRequestRowActions({
    canDelete,
    canRestore,
    canManage,
    canUpdate,
    onToggleRead: handleToggleReadWithRefresh,
    onDelete: handleDeleteSingle,
    onHardDelete: handleHardDeleteSingle,
    onRestore: handleRestoreSingle,
    markingReadRequests,
    markingUnreadRequests,
    deletingRequests,
    restoringRequests,
    hardDeletingRequests,
  })


  const fetchContactRequests = useCallback(
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
    }): Promise<DataTableResult<ContactRequestRow>> => {
      const baseUrl = apiRoutes.contactRequests.list({
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

      const response = await apiClient.get<ContactRequestsResponse>(url)
      const payload = response.data

      if (!payload || !payload.data) {
        throw new Error("Không thể tải danh sách liên hệ")
      }

      // payload.data là object { data: [...], pagination: {...} }
      const contactRequestsData = payload.data.data || []
      const pagination = payload.data.pagination

      return {
        rows: contactRequestsData,
        page: pagination?.page ?? page,
        limit: pagination?.limit ?? limit,
        total: pagination?.total ?? 0,
        totalPages: pagination?.totalPages ?? 0,
      }
    },
    [],
  )

  const buildListParams = useCallback(
    ({ query, view }: { query: DataTableQueryState; view: ResourceViewMode<ContactRequestRow> }): AdminContactRequestsListParams => {
      const filtersRecord = sanitizeFilters(query.filters)

      return {
        status: (view.status ?? "active") as AdminContactRequestsListParams["status"],
        page: query.page,
        limit: query.limit,
        search: normalizeSearch(query.search),
        filters: Object.keys(filtersRecord).length ? filtersRecord : undefined,
      }
    },
    [],
  )

  const fetchContactRequestsWithDefaults = useCallback(
    (params: AdminContactRequestsListParams) =>
      fetchContactRequests({
        page: params.page,
        limit: params.limit,
        status: (params.status ?? "active") as "active" | "deleted" | "all",
        search: params.search,
        filters: params.filters,
      }),
    [fetchContactRequests],
  )

  const loader = useResourceTableLoader<ContactRequestRow, AdminContactRequestsListParams>({
    queryClient,
    fetcher: fetchContactRequestsWithDefaults,
    buildParams: buildListParams,
    buildQueryKey: queryKeys.adminContactRequests.list,
  })


  const createActiveSelectionActions = useCallback(
    ({ selectedIds, selectedRows, clearSelection, refresh }: {
      selectedIds: string[]
      selectedRows: ContactRequestRow[]
      clearSelection: () => void
      refresh: () => void
    }) => {
      // Đếm số lượng yêu cầu chưa đọc và đã đọc
      const unreadCount = selectedRows.filter((row) => !row.isRead && !row.deletedAt).length
      const readCount = selectedRows.filter((row) => row.isRead && !row.deletedAt).length
      
      // Chỉ hiển thị button "Đánh dấu đã đọc" nếu có ít nhất một liên hệ chưa đọc
      const hasUnreadRequests = unreadCount > 0
      // Chỉ hiển thị button "Đánh dấu chưa đọc" nếu có ít nhất một liên hệ đã đọc
      const hasReadRequests = readCount > 0
      
      return (
        <SelectionActionsWrapper
          label={CONTACT_REQUEST_LABELS.SELECTED_CONTACT_REQUESTS(selectedIds.length)}
          actions={
            <>
              {canManage && (
                <>
                  {hasUnreadRequests && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={bulkState.isProcessing || selectedIds.length === 0}
                      onClick={() => {
                        // Thực hiện trực tiếp không cần confirm dialog
                        handleBulkMarkRead(selectedIds, refresh, clearSelection)
                      }}
                      className="whitespace-nowrap"
                    >
                      <CheckCircle2 className="mr-2 h-5 w-5 shrink-0" />
                      <span className="hidden sm:inline">Đánh dấu đã đọc ({unreadCount})</span>
                      <span className="sm:hidden">Đã đọc ({unreadCount})</span>
                    </Button>
                  )}
                  {hasReadRequests && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={bulkState.isProcessing || selectedIds.length === 0}
                      onClick={() => {
                        // Thực hiện trực tiếp không cần confirm dialog
                        handleBulkMarkUnread(selectedIds, refresh, clearSelection)
                      }}
                      className="whitespace-nowrap"
                    >
                      <Circle className="mr-2 h-5 w-5 shrink-0" />
                      <span className="hidden sm:inline">Đánh dấu chưa đọc ({readCount})</span>
                      <span className="sm:hidden">Chưa đọc ({readCount})</span>
                    </Button>
                  )}
                </>
              )}
            {canManage && (
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={bulkState.isProcessing || selectedIds.length === 0}
                    className="whitespace-nowrap"
                  >
                    <span className="hidden sm:inline">Cập nhật trạng thái</span>
                    <span className="sm:hidden">Trạng thái</span>
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {([
                    { label: "Mới", value: "NEW" },
                    { label: "Đang xử lý", value: "IN_PROGRESS" },
                    { label: "Đã xử lý", value: "RESOLVED" },
                    { label: "Đã đóng", value: "CLOSED" },
                  ] as Array<{ label: string; value: ContactStatus }>).map((option) => (
                    <DropdownMenuItem
                      key={option.value}
                      onClick={() => {
                        handleBulkUpdateStatus(selectedIds, option.value, refresh, clearSelection)
                      }}
                    >
                      {option.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            {canDelete && (
              <Button
                type="button"
                size="sm"
                variant="destructive"
                disabled={bulkState.isProcessing || selectedIds.length === 0}
                onClick={() => {
                  setDeleteConfirm({
                    open: true,
                    type: "soft",
                    bulkIds: selectedIds,
                    onConfirm: async () => {
                      await executeBulkAction("delete", selectedIds, refresh, clearSelection)
                    },
                  })
                }}
                className="whitespace-nowrap"
              >
                <Trash2 className="mr-2 h-5 w-5 shrink-0" />
                <span className="hidden sm:inline">
                  {CONTACT_REQUEST_LABELS.DELETE_SELECTED(selectedIds.length)}
                </span>
                <span className="sm:hidden">Xóa</span>
              </Button>
            )}
            {canManage && (
              <Button
                type="button"
                size="sm"
                variant="destructive"
                disabled={bulkState.isProcessing || selectedIds.length === 0}
                onClick={() => {
                  setDeleteConfirm({
                    open: true,
                    type: "hard",
                    bulkIds: selectedIds,
                    onConfirm: async () => {
                      await executeBulkAction("hard-delete", selectedIds, refresh, clearSelection)
                    },
                  })
                }}
                className="whitespace-nowrap"
              >
                <AlertTriangle className="mr-2 h-5 w-5 shrink-0" />
                <span className="hidden sm:inline">
                  {CONTACT_REQUEST_LABELS.HARD_DELETE_SELECTED(selectedIds.length)}
                </span>
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
              {CONTACT_REQUEST_LABELS.CLEAR_SELECTION}
            </Button>
          </>
        }
      />
    )
    },
    [canDelete, canManage, bulkState.isProcessing, setDeleteConfirm, executeBulkAction, handleBulkMarkRead, handleBulkMarkUnread, handleBulkUpdateStatus],
  )

  const createDeletedSelectionActions = useCallback(
    ({ selectedIds, clearSelection, refresh }: {
      selectedIds: string[]
      clearSelection: () => void
      refresh: () => void
    }) => (
      <SelectionActionsWrapper
        label={CONTACT_REQUEST_LABELS.SELECTED_DELETED_CONTACT_REQUESTS(selectedIds.length)}
        actions={
          <>
            {canRestore && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={bulkState.isProcessing || selectedIds.length === 0}
                onClick={() => {
                  setDeleteConfirm({
                    open: true,
                    type: "restore",
                    bulkIds: selectedIds,
                    onConfirm: async () => {
                      await executeBulkAction("restore", selectedIds, refresh, clearSelection)
                    },
                  })
                }}
                className="whitespace-nowrap"
              >
                <RotateCcw className="mr-2 h-5 w-5 shrink-0" />
                <span className="hidden sm:inline">
                  {CONTACT_REQUEST_LABELS.RESTORE_SELECTED(selectedIds.length)}
                </span>
                <span className="sm:hidden">Khôi phục</span>
              </Button>
            )}
            {canManage && (
              <Button
                type="button"
                size="sm"
                variant="destructive"
                disabled={bulkState.isProcessing || selectedIds.length === 0}
                onClick={() => {
                  setDeleteConfirm({
                    open: true,
                    type: "hard",
                    bulkIds: selectedIds,
                    onConfirm: async () => {
                      await executeBulkAction("hard-delete", selectedIds, refresh, clearSelection)
                    },
                  })
                }}
                className="whitespace-nowrap"
              >
                <AlertTriangle className="mr-2 h-5 w-5 shrink-0" />
                <span className="hidden sm:inline">
                  {CONTACT_REQUEST_LABELS.HARD_DELETE_SELECTED(selectedIds.length)}
                </span>
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
              {CONTACT_REQUEST_LABELS.CLEAR_SELECTION}
            </Button>
          </>
        }
      />
    ),
    [canRestore, canManage, bulkState.isProcessing, setDeleteConfirm, executeBulkAction],
  )

  const viewModes = useMemo<ResourceViewMode<ContactRequestRow>[]>(() => {
    const modes: ResourceViewMode<ContactRequestRow>[] = [
      {
        id: "new",
        label: CONTACT_REQUEST_LABELS.NEW,
        status: "NEW",
        columns: baseColumns,
        selectionEnabled: canDelete || canManage,
        selectionActions: canDelete || canManage ? createActiveSelectionActions : undefined,
        rowActions: (row) => renderActiveRowActions(row),
        emptyMessage: CONTACT_REQUEST_LABELS.NO_CONTACT_REQUESTS,
      },
      {
        id: "active",
        label: CONTACT_REQUEST_LABELS.ACTIVE_VIEW,
        status: "active",
        columns: baseColumns,
        selectionEnabled: canDelete || canManage,
        selectionActions: canDelete || canManage ? createActiveSelectionActions : undefined,
        rowActions: (row) => renderActiveRowActions(row),
        emptyMessage: CONTACT_REQUEST_LABELS.NO_CONTACT_REQUESTS,
      },
      {
        id: "deleted",
        label: CONTACT_REQUEST_LABELS.DELETED_VIEW,
        status: "deleted",
        columns: deletedColumns,
        selectionEnabled: canRestore || canManage,
        selectionActions: canRestore || canManage ? createDeletedSelectionActions : undefined,
        rowActions: (row) => renderDeletedRowActions(row),
        emptyMessage: CONTACT_REQUEST_LABELS.NO_DELETED_CONTACT_REQUESTS,
      },
    ]

    return modes
  }, [
    baseColumns,
    deletedColumns,
    canDelete,
    canRestore,
    canManage,
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
      return CONTACT_REQUEST_CONFIRM_MESSAGES.HARD_DELETE_TITLE(
        deleteConfirm.bulkIds?.length,
        deleteConfirm.row?.subject,
      )
    }
    if (deleteConfirm.type === "restore") {
      return CONTACT_REQUEST_CONFIRM_MESSAGES.RESTORE_TITLE(
        deleteConfirm.bulkIds?.length,
        deleteConfirm.row?.subject,
      )
    }
    return CONTACT_REQUEST_CONFIRM_MESSAGES.DELETE_TITLE(
      deleteConfirm.bulkIds?.length,
      deleteConfirm.row?.subject,
    )
  }

  const getDeleteConfirmDescription = () => {
    if (!deleteConfirm) return ""
    if (deleteConfirm.type === "hard") {
      return CONTACT_REQUEST_CONFIRM_MESSAGES.HARD_DELETE_DESCRIPTION(
        deleteConfirm.bulkIds?.length,
        deleteConfirm.row?.subject,
      )
    }
    if (deleteConfirm.type === "restore") {
      return CONTACT_REQUEST_CONFIRM_MESSAGES.RESTORE_DESCRIPTION(
        deleteConfirm.bulkIds?.length,
        deleteConfirm.row?.subject,
      )
    }
    return CONTACT_REQUEST_CONFIRM_MESSAGES.DELETE_DESCRIPTION(
      deleteConfirm.bulkIds?.length,
      deleteConfirm.row?.subject,
    )
  }

  const _buildInitialParams = useCallback(
    (data: DataTableResult<ContactRequestRow>): AdminContactRequestsListParams => ({
      status: "active",
      page: data.page,
      limit: data.limit,
      search: undefined,
      filters: undefined,
    }),
    [],
  )

  return (
    <>
      <ResourceTableClient<ContactRequestRow>
        title={CONTACT_REQUEST_LABELS.MANAGE_CONTACT_REQUESTS}
        baseColumns={baseColumns}
        loader={loader}
        viewModes={viewModes}
        defaultViewId="new"
        initialDataByView={initialDataByView}
        fallbackRowCount={6}
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
            deleteConfirm.type === "hard" || deleteConfirm.type === "soft"
              ? "destructive"
              : deleteConfirm.type === "restore"
              ? "default"
              : "destructive"
          }
          confirmLabel={
            deleteConfirm.type === "hard"
              ? CONTACT_REQUEST_CONFIRM_MESSAGES.HARD_DELETE_LABEL
              : deleteConfirm.type === "restore"
              ? CONTACT_REQUEST_CONFIRM_MESSAGES.RESTORE_LABEL
              : CONTACT_REQUEST_CONFIRM_MESSAGES.CONFIRM_LABEL
          }
          cancelLabel={CONTACT_REQUEST_CONFIRM_MESSAGES.CANCEL_LABEL}
          onConfirm={handleDeleteConfirm}
          isLoading={
            bulkState.isProcessing ||
            (deleteConfirm.row
              ? deleteConfirm.type === "restore"
                ? restoringRequests.has(deleteConfirm.row.id)
                : deleteConfirm.type === "hard"
                ? hardDeletingRequests.has(deleteConfirm.row.id)
                : deletingRequests.has(deleteConfirm.row.id)
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
