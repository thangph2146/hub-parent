import { useCallback, useState } from "react"
import { useQueryClient, useMutation } from "@tanstack/react-query"
import { apiClient } from "@/services/api/axios"
import { createAdminMutationOptions } from "../query-config"
import { useResourceBulkProcessing } from "./use-resource-bulk-processing"
import { resourceLogger } from "@/utils"
import { getErrorMessage } from "@/utils"
import type { ResourceRefreshHandler } from "../types"
import type { FeedbackVariant } from "@/components/dialogs"
import type { QueryKey } from "@tanstack/react-query"
import type { ResourceAction } from "@/types"

import { invalidateAndRefreshResource } from "../utils/helpers"

type SingleAction = "delete" | "restore" | "hard-delete" | "mark-read" | "mark-unread" | "active" | "unactive"
type BulkAction = SingleAction
type ActionType = SingleAction | `bulk-${BulkAction}`

import { isAxiosError } from "axios"

// Helper to extract message from server error
const getErrorMessageFromServer = (error: unknown, defaultMessage: string): string => {
  if (isAxiosError(error)) {
    const serverMessage = error.response?.data?.message || error.response?.data?.error
    if (serverMessage) return serverMessage
    return error.message
  }
  return error instanceof Error ? error.message : defaultMessage
}

const getActionType = (action: BulkAction, isBulk: boolean): ActionType => {
  if (isBulk) {
    return action === "delete" ? "bulk-delete"
      : action === "restore" ? "bulk-restore"
      : action === "active" ? "bulk-active"
      : action === "unactive" ? "bulk-unactive"
      : action === "mark-read" ? "bulk-mark-read"
      : action === "mark-unread" ? "bulk-mark-unread"
      : "bulk-hard-delete"
  }
  return action as SingleAction
}

export interface ResourceActionConfig<T extends { id: string }> {
  resourceName: string
  resourceDisplayName?: string
  queryKeys: {
    all: () => QueryKey
    detail?: (id: string) => QueryKey
  }
  apiRoutes: {
    delete: (id: string) => string
    restore: (id: string) => string
    hardDelete: (id: string) => string
    bulk: string
  }
  messages: {
    DELETE_SUCCESS: string
    DELETE_ERROR: string
    RESTORE_SUCCESS: string
    RESTORE_ERROR: string
    HARD_DELETE_SUCCESS: string
    HARD_DELETE_ERROR: string
    BULK_DELETE_SUCCESS: string
    BULK_DELETE_ERROR: string
    BULK_RESTORE_SUCCESS: string
    BULK_RESTORE_ERROR: string
    BULK_HARD_DELETE_SUCCESS: string
    BULK_HARD_DELETE_ERROR: string
    BULK_ACTIVE_SUCCESS?: string
    BULK_ACTIVE_ERROR?: string
    BULK_UNACTIVE_SUCCESS?: string
    BULK_UNACTIVE_ERROR?: string
    BULK_MARK_READ_SUCCESS?: string
    BULK_MARK_READ_ERROR?: string
    BULK_MARK_UNREAD_SUCCESS?: string
    BULK_MARK_UNREAD_ERROR?: string
    ACTIVE_SUCCESS?: string
    ACTIVE_ERROR?: string
    UNACTIVE_SUCCESS?: string
    UNACTIVE_ERROR?: string
    MARK_READ_SUCCESS?: string
    MARK_READ_ERROR?: string
    MARK_UNREAD_SUCCESS?: string
    MARK_UNREAD_ERROR?: string
    NO_PERMISSION?: string
    UNKNOWN_ERROR: string
  }
  getRecordName: (row: T) => string
  permissions: {
    canDelete: boolean
    canRestore: boolean
    canManage: boolean
  }
  showFeedback: (variant: FeedbackVariant, title: string, description?: string, details?: string) => void
  isSocketConnected?: boolean
  getLogMetadata?: (row: T) => Record<string, unknown>
  // New validation hooks
  beforeSingleAction?: (
    action: SingleAction,
    row: T
  ) => Promise<{ allowed: boolean; message?: string; title?: string } | void>
  beforeBulkAction?: (
    action: BulkAction,
    ids: string[],
    rows?: T[]
  ) => Promise<{ allowed: boolean; message?: string; title?: string; targetIds?: string[] } | void>
}

export interface UseResourceActionsResult<T extends { id: string }> {
  executeSingleAction: (
    action: SingleAction,
    row: T
  ) => Promise<void>
  executeBulkAction: (
    action: BulkAction,
    ids: string[],
    refresh?: ResourceRefreshHandler,
    clearSelection?: () => void,
    rows?: T[]
  ) => Promise<void>
  deletingIds: Set<string>
  restoringIds: Set<string>
  hardDeletingIds: Set<string>
  markingReadIds: Set<string>
  markingUnreadIds: Set<string>
  activatingIds: Set<string>
  deactivatingIds: Set<string>
  bulkState: ReturnType<typeof useResourceBulkProcessing>["bulkState"]
}

export const useResourceActions = <T extends { id: string }>(
  config: ResourceActionConfig<T>
): UseResourceActionsResult<T> => {
  const queryClient = useQueryClient()
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set())
  const [restoringIds, setRestoringIds] = useState<Set<string>>(new Set())
  const [hardDeletingIds, setHardDeletingIds] = useState<Set<string>>(new Set())
  const [markingReadIds, setMarkingReadIds] = useState<Set<string>>(new Set())
  const [markingUnreadIds, setMarkingUnreadIds] = useState<Set<string>>(new Set())
  const [activatingIds, setActivatingIds] = useState<Set<string>>(new Set())
  const [deactivatingIds, setDeactivatingIds] = useState<Set<string>>(new Set())
  
  const { bulkState, startBulkProcessing, stopBulkProcessing } = useResourceBulkProcessing()
  
  const singleActionMutation = useMutation({
    ...createAdminMutationOptions({
      mutationFn: async ({ action, row }: { action: SingleAction; row: T }) => {
        const endpoint = {
          delete: config.apiRoutes.delete(row.id),
          restore: config.apiRoutes.restore(row.id),
          "hard-delete": config.apiRoutes.hardDelete(row.id),
          "mark-read": config.apiRoutes.bulk,
          "mark-unread": config.apiRoutes.bulk,
          active: config.apiRoutes.bulk,
          unactive: config.apiRoutes.bulk,
        }[action]
        
        let method: "post" | "delete" = (action === "delete" || action === "hard-delete") ? "delete" : "post"
        let payload: Record<string, unknown> | undefined = undefined

        if (action === "mark-read" || action === "mark-unread" || action === "active" || action === "unactive") {
          method = "post"
          payload = { action, ids: [row.id] }
        }
        
        resourceLogger.logFlow({
          resource: config.resourceName,
          action: getActionType(action, false) as ResourceAction,
          step: "init",
          details: {
            resourceId: row.id,
            recordName: config.getRecordName(row),
            endpoint,
            method,
            ...(config.getLogMetadata ? config.getLogMetadata(row) : {}),
          },
        })
        
        const startTime = Date.now()
        let response
        
        try {
          if (method === "delete") {
            response = await apiClient.delete(endpoint)
          } else {
            response = await apiClient.post(endpoint, payload)
          }
          
          const duration = Date.now() - startTime
          resourceLogger.logFlow({
            resource: config.resourceName,
            action: getActionType(action, false) as ResourceAction,
            step: "init",
            durationMs: duration,
            details: {
              resourceId: row.id,
              recordName: config.getRecordName(row),
              apiResponseStatus: response?.status,
              ...(config.getLogMetadata ? config.getLogMetadata(row) : {}),
            },
          })
          
          return response
        } catch (error) {
          const duration = Date.now() - startTime
          resourceLogger.logFlow({
            resource: config.resourceName,
            action: getActionType(action, false) as ResourceAction,
            step: "error",
            durationMs: duration,
            details: {
              resourceId: row.id,
              recordName: config.getRecordName(row),
              apiError: error instanceof Error ? error.message : String(error),
              ...(config.getLogMetadata ? config.getLogMetadata(row) : {}),
            },
          })
          throw error
        }
      },
      onSuccess: async (response, variables) => {
        const actionType = getActionType(variables.action, false) as ResourceAction
        const isHardDelete = variables.action === "hard-delete"
        
        resourceLogger.logFlow({
          resource: config.resourceName,
          action: actionType,
          step: "init",
          details: {
            resourceId: variables.row.id,
            recordName: config.getRecordName(variables.row),
            step: "before_cache_operations",
            isHardDelete,
            skipDetailRefetch: isHardDelete,
            ...(config.getLogMetadata ? config.getLogMetadata(variables.row) : {}),
          },
        })
        
        // Chỉ invalidate queries - table sẽ tự động refresh qua query cache events
        // Hard delete: Remove detail query khỏi cache hoàn toàn để tránh refetch tự động
        if (isHardDelete && config.queryKeys.detail) {
          const detailKey = config.queryKeys.detail(variables.row.id)
          await queryClient.removeQueries({ queryKey: detailKey })
        }
        
        // Invalidate all queries và detail query (nếu không phải hard delete)
        // Sử dụng invalidateAndRefreshResource để đảm bảo sync UI
        await invalidateAndRefreshResource({
          queryClient,
          allQueryKey: config.queryKeys.all(),
          detailQueryKey: !isHardDelete ? config.queryKeys.detail : undefined,
          resourceId: !isHardDelete ? variables.row.id : undefined,
          skipDetailRefetch: isHardDelete,
        })

        resourceLogger.logFlow({
          resource: config.resourceName,
          action: actionType,
          step: "success",
          details: {
            resourceId: variables.row.id,
            recordName: config.getRecordName(variables.row),
            step: "after_cache_operations",
            apiResponseStatus: response?.status,
            ...(config.getLogMetadata ? config.getLogMetadata(variables.row) : {}),
          },
        })
      },
      onError: (error, variables) => {
        const actionType = getActionType(variables.action, false) as ResourceAction
        const errorMessage = getErrorMessage(error) || config.messages.UNKNOWN_ERROR
        
        resourceLogger.logFlow({
          resource: config.resourceName,
          action: actionType,
          step: "error",
          details: {
            resourceId: variables.row.id,
            recordName: config.getRecordName(variables.row),
            error: errorMessage,
            errorType: error instanceof Error ? error.constructor.name : typeof error,
            errorStack: error instanceof Error ? error.stack : undefined,
            ...(config.getLogMetadata ? config.getLogMetadata(variables.row) : {}),
          },
        })
      },
    }),
  })
  
  const bulkActionMutation = useMutation({
    ...createAdminMutationOptions({
      mutationFn: async ({ action, ids }: { action: "delete" | "restore" | "hard-delete" | "active" | "unactive" | "mark-read" | "mark-unread"; ids: string[] }) => {
        const actionType = getActionType(action, true) as ResourceAction
        
        resourceLogger.logFlow({
          resource: config.resourceName,
          action: actionType,
          step: "init",
          details: {
            requestedCount: ids.length,
            requestedIds: ids,
            endpoint: config.apiRoutes.bulk,
            method: "POST",
          },
        })
        
        const startTime = Date.now()
        try {
          const response = await apiClient.post(config.apiRoutes.bulk, { action, ids })
          const duration = Date.now() - startTime
          
          resourceLogger.logFlow({
            resource: config.resourceName,
            action: actionType,
            step: "init",
            durationMs: duration,
            details: {
              requestedCount: ids.length,
              requestedIds: ids,
              apiResponseStatus: response?.status,
            },
          })
          
          return response
        } catch (error) {
          const duration = Date.now() - startTime
          resourceLogger.logFlow({
            resource: config.resourceName,
            action: actionType,
            step: "error",
            durationMs: duration,
            details: {
              requestedCount: ids.length,
              requestedIds: ids,
              apiError: error instanceof Error ? error.message : String(error),
            },
          })
          throw error
        }
      },
      onSuccess: async (response, variables) => {
        const result = response.data?.data
        const affected = result?.affected ?? 0
        const actionType = getActionType(variables.action, true) as ResourceAction
        const isHardDelete = variables.action === "hard-delete"
        
        resourceLogger.logFlow({
          resource: config.resourceName,
          action: actionType,
          step: "init",
          details: {
            requestedCount: variables.ids.length,
            affectedCount: affected,
            requestedIds: variables.ids,
            step: "before_cache_operations",
            isHardDelete,
            skipDetailRefetch: isHardDelete,
          },
        })
        
        // Sử dụng invalidateAndRefreshResource để đảm bảo sync UI cho bulk actions
        // Chỉ trigger registry refresh một lần duy nhất cho toàn bộ batch
        await invalidateAndRefreshResource({
          queryClient,
          allQueryKey: config.queryKeys.all(),
        })

        // Invalidate detail queries cho tất cả affected IDs
        if (config.queryKeys.detail) {
          resourceLogger.logFlow({
            resource: config.resourceName,
            action: actionType,
            step: "init",
            details: {
              operation: isHardDelete ? "remove_detail_queries" : "invalidate_detail_queries",
              idsCount: variables.ids.length,
              ids: variables.ids,
            },
          })
          
          for (const id of variables.ids) {
            const detailKey = config.queryKeys.detail(id)
            if (isHardDelete) {
              await queryClient.removeQueries({ queryKey: detailKey })
            } else {
              // Invalidate detail queries với refetchType: "all" để đảm bảo detail page cập nhật
              await queryClient.invalidateQueries({ queryKey: detailKey, refetchType: "all" })
            }
          }
        }
        
        resourceLogger.logFlow({
          resource: config.resourceName,
          action: actionType,
          step: "success",
          details: {
            requestedCount: variables.ids.length,
            affectedCount: affected,
            requestedIds: variables.ids,
            step: "after_cache_operations",
            apiResponseStatus: response?.status,
          },
        })
        
        resourceLogger.logFlow({
          resource: config.resourceName,
          action: actionType,
          step: "success",
          details: {
            requestedCount: variables.ids.length,
            affectedCount: affected,
          },
        })
      },
      onError: (error, variables) => {
        const actionType = getActionType(variables.action, true) as ResourceAction
        const errorMessage = error instanceof Error 
          ? error.message 
          : config.messages.UNKNOWN_ERROR
        
        resourceLogger.logFlow({
          resource: config.resourceName,
          action: actionType,
          step: "error",
          details: {
            requestedCount: variables.ids.length,
            requestedIds: variables.ids,
            error: errorMessage,
            errorType: error instanceof Error ? error.constructor.name : typeof error,
            errorStack: error instanceof Error ? error.stack : undefined,
          },
        })
      },
    }),
  })
  
  const executeSingleAction = useCallback(
    async (
      action: SingleAction,
      row: T,
    ): Promise<void> => {
      // 1. Kiểm tra validation hook trước khi thực hiện
      if (config.beforeSingleAction) {
        const validation = await config.beforeSingleAction(action, row)
        if (validation && !validation.allowed) {
          config.showFeedback(
            "error", 
            validation.title || "Không thể thực hiện", 
            validation.message || "Hành động này không được phép"
          )
          return
        }
      }

      const actionConfig = {
        delete: {
          permission: config.permissions.canDelete,
          successTitle: config.messages.DELETE_SUCCESS,
          successDescription: `Đã xóa ${config.getRecordName(row)}`,
          errorTitle: config.messages.DELETE_ERROR,
          errorDescription: `Không thể xóa ${config.getRecordName(row)}`,
        },
        restore: {
          permission: config.permissions.canRestore,
          successTitle: config.messages.RESTORE_SUCCESS,
          successDescription: `Đã khôi phục "${config.getRecordName(row)}"`,
          errorTitle: config.messages.RESTORE_ERROR,
          errorDescription: `Không thể khôi phục "${config.getRecordName(row)}"`,
        },
        "hard-delete": {
          permission: config.permissions.canManage,
          successTitle: config.messages.HARD_DELETE_SUCCESS,
          successDescription: `Đã xóa vĩnh viễn ${config.getRecordName(row)}`,
          errorTitle: config.messages.HARD_DELETE_ERROR,
          errorDescription: `Không thể xóa vĩnh viễn ${config.getRecordName(row)}`,
        },
        "mark-read": {
          permission: true,
          successTitle: config.messages.MARK_READ_SUCCESS || "Đã đánh dấu đã đọc",
          successDescription: `Đã đánh dấu đã đọc ${config.getRecordName(row)}`,
          errorTitle: config.messages.MARK_READ_ERROR || "Lỗi",
          errorDescription: `Không thể đánh dấu đã đọc ${config.getRecordName(row)}`,
        },
        "mark-unread": {
          permission: true,
          successTitle: config.messages.MARK_UNREAD_SUCCESS || "Đã đánh dấu chưa đọc",
          successDescription: `Đã đánh dấu chưa đọc ${config.getRecordName(row)}`,
          errorTitle: config.messages.MARK_UNREAD_ERROR || "Lỗi",
          errorDescription: `Không thể đánh dấu chưa đọc ${config.getRecordName(row)}`,
        },
        active: {
          permission: config.permissions.canManage,
          successTitle: config.messages.ACTIVE_SUCCESS || "Đã kích hoạt",
          successDescription: `Đã kích hoạt ${config.getRecordName(row)}`,
          errorTitle: config.messages.ACTIVE_ERROR || "Lỗi",
          errorDescription: `Không thể kích hoạt ${config.getRecordName(row)}`,
        },
        unactive: {
          permission: config.permissions.canManage,
          successTitle: config.messages.UNACTIVE_SUCCESS || "Đã hủy kích hoạt",
          successDescription: `Đã hủy kích hoạt ${config.getRecordName(row)}`,
          errorTitle: config.messages.UNACTIVE_ERROR || "Lỗi",
          errorDescription: `Không thể hủy kích hoạt ${config.getRecordName(row)}`,
        },
      }[action]
      
      if (!actionConfig.permission) {
        resourceLogger.logAction({
          resource: config.resourceName,
          action: action as ResourceAction,
          resourceId: row.id,
          permissionDenied: true,
        })
        config.showFeedback("error", actionConfig.errorTitle, config.messages.NO_PERMISSION || "Từ chối truy cập")
        return
      }
      
      // Log chi tiết khi user chọn action và confirm
      const recordName = config.getRecordName(row)
      resourceLogger.logFlow({
        resource: config.resourceName,
        action: getActionType(action, false) as ResourceAction,
        step: "start",
        details: {
          action: action,
          actionType: getActionType(action, false),
          resourceId: row.id,
          recordName: recordName,
          itemInfo: {
            id: row.id,
            name: recordName,
            ...(config.getLogMetadata ? config.getLogMetadata(row) : {}),
          },
          socketConnected: config.isSocketConnected,
          userAction: "user_confirmed_action",
        },
      })
      
      const setLoadingState = action === "delete" 
        ? setDeletingIds 
        : action === "restore" 
        ? setRestoringIds 
        : action === "mark-read"
        ? setMarkingReadIds
        : action === "mark-unread"
        ? setMarkingUnreadIds
        : action === "active"
        ? setActivatingIds
        : action === "unactive"
        ? setDeactivatingIds
        : setHardDeletingIds
      
      setLoadingState((prev) => new Set(prev).add(row.id))
      
      try {
        await singleActionMutation.mutateAsync({ action, row })
        
        config.showFeedback("success", actionConfig.successTitle, actionConfig.successDescription)
        
        // Refresh đã được trigger qua registry trong onSuccess của mutation
        // Listener/polling sẽ handle refresh nếu registry không tìm thấy callback
        // Không cần gọi thêm ở đây để tránh duplicate refresh calls
      } catch (error: unknown) {
        const errorMessage = getErrorMessageFromServer(error, config.messages.UNKNOWN_ERROR)
        config.showFeedback("error", actionConfig.errorTitle, actionConfig.errorDescription, errorMessage)
        
        if (action !== "restore") {
          throw error
        }
      } finally {
        setLoadingState((prev) => {
          const next = new Set(prev)
          next.delete(row.id)
          return next
        })
      }
    },
    [config, singleActionMutation]
  )
  
  const executeBulkAction = useCallback(
    async (
      action: "delete" | "restore" | "hard-delete" | "active" | "unactive" | "mark-read" | "mark-unread",
      ids: string[],
      _refresh?: ResourceRefreshHandler, // Không sử dụng vì registry đã tự động trigger refresh
      clearSelection: () => void = () => {},
      rows?: T[]
    ): Promise<void> => {
      if (ids.length === 0) return

      // 1. Kiểm tra validation hook trước khi thực hiện
      let targetIds = ids
      if (config.beforeBulkAction) {
        const validation = await config.beforeBulkAction(action, ids, rows)
        if (validation && !validation.allowed) {
          config.showFeedback(
            "error", 
            validation.title || "Không thể thực hiện", 
            validation.message || "Hành động này không được phép"
          )
          return
        }
        if (validation?.targetIds) {
          targetIds = validation.targetIds
          if (targetIds.length === 0) {
            config.showFeedback(
              "info", 
              validation.title || "Thông báo", 
              validation.message || `Không có ${config.resourceDisplayName || "mục"} nào hợp lệ để thực hiện hành động này`
            )
            clearSelection()
            return
          }
        }
      }

      if (!startBulkProcessing()) return
      
      // Check permission before making API call
      const actionConfig = {
        delete: {
          permission: config.permissions.canDelete,
          successTitle: config.messages.BULK_DELETE_SUCCESS,
          errorTitle: config.messages.BULK_DELETE_ERROR,
        },
        restore: {
          permission: config.permissions.canRestore,
          successTitle: config.messages.BULK_RESTORE_SUCCESS,
          errorTitle: config.messages.BULK_RESTORE_ERROR,
        },
        "hard-delete": {
          permission: config.permissions.canManage,
          successTitle: config.messages.BULK_HARD_DELETE_SUCCESS,
          errorTitle: config.messages.BULK_HARD_DELETE_ERROR,
        },
        active: {
          permission: config.permissions.canManage,
          successTitle: config.messages.BULK_ACTIVE_SUCCESS || "Đã kích hoạt hàng loạt",
          errorTitle: config.messages.BULK_ACTIVE_ERROR || "Lỗi kích hoạt hàng loạt",
        },
        unactive: {
          permission: config.permissions.canManage,
          successTitle: config.messages.BULK_UNACTIVE_SUCCESS || "Đã hủy kích hoạt hàng loạt",
          errorTitle: config.messages.BULK_UNACTIVE_ERROR || "Lỗi hủy kích hoạt hàng loạt",
        },
        "mark-read": {
          permission: true,
          successTitle: config.messages.BULK_MARK_READ_SUCCESS || "Đã đánh dấu đã đọc hàng loạt",
          errorTitle: config.messages.BULK_MARK_READ_ERROR || "Lỗi đánh dấu đã đọc hàng loạt",
        },
        "mark-unread": {
          permission: true,
          successTitle: config.messages.BULK_MARK_UNREAD_SUCCESS || "Đã đánh dấu chưa đọc hàng loạt",
          errorTitle: config.messages.BULK_MARK_UNREAD_ERROR || "Lỗi đánh dấu chưa đọc hàng loạt",
        },
      }[action]
      
      if (!actionConfig.permission) {
        resourceLogger.logAction({
          resource: config.resourceName,
          action: action as ResourceAction,
          bulk: true,
          count: ids.length,
          permissionDenied: true,
        })
        config.showFeedback("error", actionConfig.errorTitle, config.messages.NO_PERMISSION || "Từ chối truy cập")
        stopBulkProcessing()
        return
      }
      
      const actionType = getActionType(action, true) as ResourceAction
      resourceLogger.logFlow({
        resource: config.resourceName,
        action: actionType,
        step: "start",
        details: {
          action: action,
          actionType: actionType,
          selectedCount: targetIds.length,
          selectedIds: targetIds,
          userAction: "user_confirmed_bulk_action",
          socketConnected: config.isSocketConnected,
          itemsInfo: {
            count: targetIds.length,
            ids: targetIds,
          },
        },
      })
      
      try {
        const response = await bulkActionMutation.mutateAsync({ action, ids: targetIds })
        
        const result = response.data?.data
        const affected = result?.affected ?? 0
        const alreadyAffected = result?.alreadyAffected ?? 0
        
        if (affected === 0) {
          const actionTextMap: Record<BulkAction, string> = {
            restore: "khôi phục",
            delete: "xóa",
            active: "kích hoạt",
            unactive: "bỏ kích hoạt",
            "hard-delete": "xóa vĩnh viễn",
            "mark-read": "đánh dấu đã đọc",
            "mark-unread": "đánh dấu chưa đọc",
          }
          const actionText = actionTextMap[action] || "xử lý"
          
          const displayName = config.resourceDisplayName || config.resourceName
          let errorMessage = result?.message || `Không có ${displayName} nào được ${actionText}`
          if (alreadyAffected > 0) {
            errorMessage = `Tất cả ${alreadyAffected} ${config.resourceDisplayName || "mục"} đã chọn đều đã ở trạng thái này`
          }

          config.showFeedback("info", "Không có thay đổi", errorMessage)
          clearSelection()
          
          resourceLogger.logFlow({
            resource: config.resourceName,
            action: getActionType(action, true) as ResourceAction,
            step: "info",
            details: {
              requestedCount: ids.length,
              affectedCount: 0,
              alreadyAffected,
              message: errorMessage,
            },
          })
          return
        }
        
        const displayName = config.resourceDisplayName || config.resourceName
        let successMessage = `${actionConfig.successTitle} (${affected} ${displayName})`
        if (alreadyAffected > 0) {
          successMessage += `. (${alreadyAffected} ${config.resourceDisplayName || "mục"} khác đã ở trạng thái này)`
        }
        
        config.showFeedback("success", "Thành công", successMessage)
        clearSelection()
      } catch (error: unknown) {
        const actionTextMap: Record<BulkAction, string> = {
          restore: "khôi phục",
          delete: "xóa",
          active: "kích hoạt",
          unactive: "bỏ kích hoạt",
          "hard-delete": "xóa vĩnh viễn",
          "mark-read": "đánh dấu đã đọc",
          "mark-unread": "đánh dấu chưa đọc",
        }
        const actionText = actionTextMap[action] || "xử lý"
        const errorMessage = getErrorMessageFromServer(error, `Không thể ${actionText} hàng loạt`)
        config.showFeedback("error", "Lỗi", errorMessage)
      } finally {
        stopBulkProcessing()
      }
    },
    [config, bulkActionMutation, startBulkProcessing, stopBulkProcessing]
  )
  
  return {
    executeSingleAction,
    executeBulkAction,
    deletingIds,
    restoringIds,
    hardDeletingIds,
    markingReadIds,
    markingUnreadIds,
    activatingIds,
    deactivatingIds,
    bulkState,
  }
}

