"use client"

import { IconSize } from "@/components/ui/typography"

import { useCallback, useMemo, useState } from "react"
import { RotateCcw, Trash2, AlertTriangle, Plus, CheckCircle2, XCircle } from "lucide-react"

import { ConfirmDialog, FeedbackVariant } from "@/components/dialogs"
import type { DataTableQueryState, DataTableResult } from "@/components/tables"
import { FeedbackDialog } from "@/components/dialogs"
import { Button } from "@/components/ui/button"
import { toast } from "@/hooks"
import { ResourceTableClient, SelectionActionsWrapper } from "@/features/admin/resources/components"
import type { ResourceViewMode } from "@/features/admin/resources/types"
import {
  useResourceTableRefresh,
  useResourceTableLoader,
  useResourceTableLogger,
} from "@/features/admin/resources/hooks"
import { sanitizeFilters, normalizeSearch } from "@/features/admin/resources/utils"
import { apiClient } from "@/services/api/axios"
import { apiRoutes } from "@/constants"
import { useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "@/constants"
import { useStudentsSocketBridge } from "../hooks/use-students-socket-bridge"
import { useStudentActions } from "../hooks/use-student-actions"
import { useStudentFeedback } from "../hooks/use-student-feedback"
import { useStudentDeleteConfirm } from "../hooks/use-student-delete-confirm"
import { useStudentColumns } from "../utils/columns"
import { useStudentRowActions } from "../utils/row-actions"
import { useResourceRouter } from "@/hooks"

import type { AdminStudentsListParams } from "@/constants"
import type { StudentRow, StudentsResponse, StudentsTableClientProps } from "../types"
import { STUDENT_CONFIRM_MESSAGES, STUDENT_LABELS } from "../constants/messages"
import { resourceLogger } from "@/utils"

export const StudentsTableClient = ({
  canDelete = false,
  canRestore = false,
  canManage = false,
  canCreate = false,
  canUpdate = false,
  canActivate = false,
  isParent = false,
  initialData,
}: StudentsTableClientProps) => {
  const router = useResourceRouter()
  const queryClient = useQueryClient()
  const { isSocketConnected, cacheVersion } = useStudentsSocketBridge()
  const { feedback, showFeedback, handleFeedbackOpenChange } = useStudentFeedback()
  const { deleteConfirm, setDeleteConfirm, handleDeleteConfirm } = useStudentDeleteConfirm()

  // Wrapper showFeedback để chuyển đổi bulk toggle sang toast
  const showFeedbackWithToast = useCallback(
    (variant: FeedbackVariant, title: string, description?: string, details?: string) => {
      // Chỉ chuyển đổi sang toast cho bulk toggle actions (active/unactive)
      // Các actions khác (delete, restore, hard-delete) vẫn sử dụng dialog
      if (title.includes("Kích hoạt hàng loạt") || title.includes("Bỏ kích hoạt hàng loạt")) {
        toast({
          variant: variant === "success" ? "success" : "destructive",
          title,
          description: description || details,
        })
      } else {
        showFeedback(variant, title, description, details)
      }
    },
    [showFeedback],
  )

  const {
    executeSingleAction,
    executeBulkAction,
    activatingIds,
    deactivatingIds,
    deletingIds,
    restoringIds,
    hardDeletingIds,
    bulkState,
  } = useStudentActions({
    canDelete,
    canRestore,
    canManage,
    isSocketConnected,
    showFeedback: showFeedbackWithToast,
  })

  // Aliases for backward compatibility
  const togglingStudents = useMemo(() => new Set([...activatingIds, ...deactivatingIds]), [activatingIds, deactivatingIds])

  // Parent mặc định xem "all", Admin/SuperAdmin xem "active"
  const [currentViewId, setCurrentViewId] = useState<string>(isParent ? "all" : "active")

  const initialDataByView = useMemo(
    () => {
      if (!initialData) return undefined
      // Parent có default view là "all", Admin/SuperAdmin có default view là "active"
      const viewKey = isParent ? "all" : "active"
      return { [viewKey]: initialData } as Record<string, DataTableResult<StudentRow>>
    },
    [initialData, isParent],
  )

  useResourceTableLogger<StudentRow>({
    resourceName: "students",
    initialData,
    initialDataByView: initialDataByView,
    currentViewId,
    queryClient,
    buildQueryKey: (params) => queryKeys.adminStudents.list({
      ...params,  status: params.status as AdminStudentsListParams["status"],
      search: undefined,
      filters: undefined,
    }),
    columns: ["id", "studentCode", "name", "email", "isActive", "createdAt", "deletedAt"],
    getRowData: (row) => ({
      id: row.id,
      studentCode: row.studentCode,
      name: row.name,
      email: row.email,
      isActive: row.isActive,
      createdAt: row.createdAt,
      deletedAt: row.deletedAt,
    }),
    cacheVersion: bulkState.isProcessing ? undefined : cacheVersion,
  })

  const getInvalidateQueryKey = useCallback(() => queryKeys.adminStudents.all(), [])
  const { onRefreshReady, refresh: refreshTable } = useResourceTableRefresh({
    queryClient,
    getInvalidateQueryKey,
    cacheVersion: bulkState.isProcessing ? undefined : cacheVersion,
  })

  const handleToggleStatusWithRefresh = useCallback(
    (row: StudentRow, checked: boolean) => {
      resourceLogger.logFlow({
        resource: "students",
        action: "toggle-status",
        step: "init",
        details: {
          operation: "user_clicked_toggle_switch",
          resourceId: row.id,
          recordName: row.studentCode,
          newStatus: checked,
          currentStatus: row.isActive,
          currentViewId,
          userAction: "user_clicked_toggle_switch",
        },
      })
      
      // Gọi trực tiếp executeSingleAction, toast sẽ được hiển thị trong hook
      executeSingleAction(checked ? "active" : "unactive", row, refreshTable)
    },
    [executeSingleAction, refreshTable, currentViewId],
  )


  const { baseColumns, deletedColumns } = useStudentColumns({
    togglingStudents,
    canToggleStatus: canActivate,
    onToggleStatus: handleToggleStatusWithRefresh,
    isParent,
  })

  const handleDeleteSingle = useCallback(
    (row: StudentRow) => {
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
    (row: StudentRow) => {
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
    (row: StudentRow) => {
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

  const { renderActiveRowActions, renderDeletedRowActions } = useStudentRowActions({
    canDelete,
    canRestore,
    canManage,
    canUpdate,
    onDelete: handleDeleteSingle,
    onHardDelete: handleHardDeleteSingle,
    onRestore: handleRestoreSingle,
    deletingIds,
    restoringIds,
    hardDeletingIds,
  })

  const fetchStudents = useCallback(
    async (params: AdminStudentsListParams): Promise<DataTableResult<StudentRow>> => {
      const baseUrl = apiRoutes.students.list({
        page: params.page,
        limit: params.limit,
        status: (params.status ?? "active") as "active" | "inactive" | "deleted" | "all",
        search: params.search,
      })

      const filterParams = new URLSearchParams()
      Object.entries(params.filters ?? {}).forEach(([key, value]) => {
        if (value) {
          filterParams.set(`filter[${key}]`, value)
        }
      })

      const filterString = filterParams.toString()
      const url = filterString ? `${baseUrl}&${filterString}` : baseUrl

      const response = await apiClient.get<{
        success: boolean
        data?: StudentsResponse
        error?: string
        message?: string
      }>(url)

      const payload = response.data.data
      if (!payload) {
        throw new Error(response.data.error || response.data.message || "Không thể tải danh sách sinh viên")
      }

      const rows = Array.isArray(payload.data) ? payload.data : []

      const result = {
        rows,
        page: payload.pagination?.page ?? params.page,
        limit: payload.pagination?.limit ?? params.limit,
        total: payload.pagination?.total ?? rows.length,
        totalPages: payload.pagination?.totalPages ?? 0,
      }

      resourceLogger.logAction({
        resource: "students",
        action: "load-table",
        view: params.status ?? "active",
        page: result.page,
        total: result.total,
      })

      resourceLogger.logStructure({
        resource: "students",
        dataType: "table",
        structure: {
          columns: result.rows.length > 0 ? Object.keys(result.rows[0]) : [],
          pagination: {
            page: result.page,
            limit: result.limit,
            total: result.total,
            totalPages: result.totalPages,
          },
          sampleRows: result.rows.map((row) => row as unknown as Record<string, unknown>),
        },
        rowCount: result.rows.length,
      })

      return result
    },
    [],
  )

  const buildParams = useCallback(
    ({ query, view }: { query: DataTableQueryState; view: ResourceViewMode<StudentRow> }): AdminStudentsListParams => {
      const filtersRecord = sanitizeFilters(query.filters)
      return {
        status: (view.status ?? "active") as AdminStudentsListParams["status"],
        page: query.page,
        limit: query.limit,
        search: normalizeSearch(query.search),
        filters: Object.keys(filtersRecord).length ? filtersRecord : undefined,
      }
    },
    [],
  )

  const buildQueryKey = useCallback((params: AdminStudentsListParams) => queryKeys.adminStudents.list(params), [])

  const loader = useResourceTableLoader({
    queryClient,
    fetcher: fetchStudents,
    buildParams,
    buildQueryKey,
  })


  const executeBulk = useCallback(
    (action: "delete" | "restore" | "hard-delete" | "active" | "unactive", ids: string[], clearSelection: () => void) => {
      if (ids.length === 0) return

      if (action === "delete" || action === "restore" || action === "hard-delete") {
        setDeleteConfirm({
          open: true,
          type: action === "hard-delete" ? "hard" : action === "restore" ? "restore" : "soft",
          bulkIds: ids,
          onConfirm: async () => {
            await executeBulkAction(action, ids, refreshTable, clearSelection)
          },
        })
      } else {
        // "active" và "unactive": gọi trực tiếp với toast, không hiển thị dialog
        // executeBulkAction sẽ tự xử lý toast thông qua showFeedback
        executeBulkAction(action, ids, refreshTable, clearSelection)
      }
    },
    [executeBulkAction, setDeleteConfirm, refreshTable],
  )

  const createActiveSelectionActions = useCallback(
    ({
      selectedIds,
      selectedRows,
      clearSelection,
      refresh: _refresh,
    }: {
      selectedIds: string[]
      selectedRows: StudentRow[]
      clearSelection: () => void
      refresh: () => void
    }) => {
      // Chỉ hiển thị nút "Kích hoạt" nếu có ít nhất một student chưa active và chưa bị xóa
      const hasInactiveStudents = selectedRows.some(
        (row) => !row.isActive && !row.deletedAt
      )
      // Chỉ hiển thị nút "Bỏ kích hoạt" nếu có ít nhất một student đang active và chưa bị xóa
      const hasActiveStudents = selectedRows.some(
        (row) => row.isActive && !row.deletedAt
      )
      
      return (
        <SelectionActionsWrapper
          label={STUDENT_LABELS.SELECTED_STUDENTS(selectedIds.length)}
          actions={
            <>
              {canActivate && hasInactiveStudents && (
                <Button
                  type="button"
                  size="sm"
                  variant="default"
                  disabled={bulkState.isProcessing || selectedIds.length === 0}
                  onClick={() => executeBulk("active", selectedIds, clearSelection)}
                  className="whitespace-nowrap"
                >
                  <IconSize size="md" className="mr-2 shrink-0">
                    <CheckCircle2 />
                  </IconSize>
                  <span>
                    {STUDENT_LABELS.ACTIVE_SELECTED(selectedIds.length)}
                  </span>
                </Button>
              )}
              {canActivate && hasActiveStudents && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={bulkState.isProcessing || selectedIds.length === 0}
                  onClick={() => executeBulk("unactive", selectedIds, clearSelection)}
                  className="whitespace-nowrap"
                >
                  <IconSize size="md" className="mr-2 shrink-0">
                    <XCircle />
                  </IconSize>
                  <span>
                    {STUDENT_LABELS.UNACTIVE_SELECTED(selectedIds.length)}
                  </span>
                </Button>
              )}
            <Button
              type="button"
              size="sm"
              variant="destructive"
              disabled={bulkState.isProcessing || selectedIds.length === 0}
              onClick={() => executeBulk("delete", selectedIds, clearSelection)}
              className="whitespace-nowrap"
            >
              <IconSize size="md" className="mr-2 shrink-0">
                <Trash2 />
              </IconSize>
              <span>
                {STUDENT_LABELS.DELETE_SELECTED(selectedIds.length)}
              </span>
            </Button>
            {canManage && (
              <Button
                type="button"
                size="sm"
                variant="destructive"
                disabled={bulkState.isProcessing || selectedIds.length === 0}
                onClick={() => executeBulk("hard-delete", selectedIds, clearSelection)}
                className="whitespace-nowrap"
              >
                <IconSize size="md" className="mr-2 shrink-0">
                  <AlertTriangle />
                </IconSize>
                <span>
                  {STUDENT_LABELS.HARD_DELETE_SELECTED(selectedIds.length)}
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
              {STUDENT_LABELS.CLEAR_SELECTION}
            </Button>
          </>
        }
      />
    )
    },
    [canActivate, canManage, bulkState.isProcessing, executeBulk],
  )

  const createDeletedSelectionActions = useCallback(
    ({
      selectedIds,
      clearSelection,
      refresh: _refresh,
    }: {
      selectedIds: string[]
      clearSelection: () => void
      refresh: () => void
    }) => (
      <SelectionActionsWrapper
        label={STUDENT_LABELS.SELECTED_DELETED_STUDENTS(selectedIds.length)}
        actions={
          <>
            {canRestore && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={bulkState.isProcessing || selectedIds.length === 0}
                onClick={() => executeBulk("restore", selectedIds, clearSelection)}
                className="whitespace-nowrap"
              >
                <IconSize size="md" className="mr-2 shrink-0">
                  <RotateCcw />
                </IconSize>
                <span>
                  {STUDENT_LABELS.RESTORE_SELECTED(selectedIds.length)}
                </span>
              </Button>
            )}
            {canManage && (
              <Button
                type="button"
                size="sm"
                variant="destructive"
                disabled={bulkState.isProcessing || selectedIds.length === 0}
                onClick={() => executeBulk("hard-delete", selectedIds, clearSelection)}
                className="whitespace-nowrap"
              >
                <IconSize size="md" className="mr-2 shrink-0">
                  <AlertTriangle />
                </IconSize>
                <span>
                  {STUDENT_LABELS.HARD_DELETE_SELECTED(selectedIds.length)}
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
              {STUDENT_LABELS.CLEAR_SELECTION}
            </Button>
          </>
        }
      />
    ),
    [canRestore, canManage, bulkState.isProcessing, executeBulk],
  )

  const viewModes = useMemo<ResourceViewMode<StudentRow>[]>(() => {
    const modes: ResourceViewMode<StudentRow>[] = []

    // Parent xem tất cả students (kể cả inactive) với view mode "all"
    if (isParent) {
      modes.push({
        id: "all",
        label: STUDENT_LABELS.ALL_VIEW,
        status: "all",
        columns: baseColumns,
        selectionEnabled: canDelete,
        selectionActions: canDelete ? createActiveSelectionActions : undefined,
        rowActions: (row) => renderActiveRowActions(row),
        emptyMessage: STUDENT_LABELS.NO_STUDENTS,
      })
    } else {
      // Admin/SuperAdmin xem active students
      modes.push({
        id: "active",
        label: STUDENT_LABELS.ACTIVE_VIEW,
        status: "active",
        columns: baseColumns,
        selectionEnabled: canDelete,
        selectionActions: canDelete ? createActiveSelectionActions : undefined,
        rowActions: (row) => renderActiveRowActions(row),
        emptyMessage: STUDENT_LABELS.NO_STUDENTS,
      })
    }

    // Chỉ thêm view inactive nếu có permission STUDENTS_ACTIVE
    if (canActivate) {
      modes.push({
        id: "inactive",
        label: STUDENT_LABELS.INACTIVE_VIEW,
        status: "inactive",
        columns: baseColumns,
        selectionEnabled: canDelete,
        selectionActions: canDelete ? createActiveSelectionActions : undefined,
        rowActions: (row) => renderActiveRowActions(row),
        emptyMessage: STUDENT_LABELS.NO_INACTIVE_STUDENTS,
      })
    }

    modes.push({
      id: "deleted",
      label: STUDENT_LABELS.DELETED_VIEW,
      status: "deleted",
      columns: deletedColumns,
      selectionEnabled: canRestore || canManage,
      selectionActions: canRestore || canManage ? createDeletedSelectionActions : undefined,
      rowActions: (row) => renderDeletedRowActions(row),
      emptyMessage: STUDENT_LABELS.NO_DELETED_STUDENTS,
    })

    return modes
  }, [
    isParent,
    canDelete,
    canRestore,
    canManage,
    canActivate,
    baseColumns,
    deletedColumns,
    createActiveSelectionActions,
    createDeletedSelectionActions,
    renderActiveRowActions,
    renderDeletedRowActions,
  ])

  const getDeleteConfirmTitle = () => {
    if (!deleteConfirm) return ""
    if (deleteConfirm.type === "hard") {
      return STUDENT_CONFIRM_MESSAGES.HARD_DELETE_TITLE(
        deleteConfirm.bulkIds?.length,
        deleteConfirm.row?.studentCode,
      )
    }
    if (deleteConfirm.type === "restore") {
      return STUDENT_CONFIRM_MESSAGES.RESTORE_TITLE(
        deleteConfirm.bulkIds?.length,
        deleteConfirm.row?.studentCode,
      )
    }
    return STUDENT_CONFIRM_MESSAGES.DELETE_TITLE(
      deleteConfirm.bulkIds?.length,
      deleteConfirm.row?.studentCode,
    )
  }

  const getDeleteConfirmDescription = () => {
    if (!deleteConfirm) return ""
    if (deleteConfirm.type === "hard") {
      return STUDENT_CONFIRM_MESSAGES.HARD_DELETE_DESCRIPTION(
        deleteConfirm.bulkIds?.length,
        deleteConfirm.row?.studentCode,
      )
    }
    if (deleteConfirm.type === "restore") {
      return STUDENT_CONFIRM_MESSAGES.RESTORE_DESCRIPTION(
        deleteConfirm.bulkIds?.length,
        deleteConfirm.row?.studentCode,
      )
    }
    return STUDENT_CONFIRM_MESSAGES.DELETE_DESCRIPTION(
      deleteConfirm.bulkIds?.length,
      deleteConfirm.row?.studentCode,
    )
  }

  const headerActions = canCreate ? (
    <Button
      type="button"
      size="sm"
      onClick={() => router.push("/admin/students/new")}
      className="h-8 px-3"
    >
      <IconSize size="md" className="mr-2">
        <Plus />
      </IconSize>
      {STUDENT_LABELS.ADD_NEW}
    </Button>
  ) : undefined

  return (
    <>
      <ResourceTableClient<StudentRow>
        title={STUDENT_LABELS.MANAGE_STUDENTS}
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
              ? STUDENT_CONFIRM_MESSAGES.HARD_DELETE_LABEL
              : deleteConfirm.type === "restore"
              ? STUDENT_CONFIRM_MESSAGES.RESTORE_LABEL
              : STUDENT_CONFIRM_MESSAGES.CONFIRM_LABEL
          }
          cancelLabel={STUDENT_CONFIRM_MESSAGES.CANCEL_LABEL}
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

