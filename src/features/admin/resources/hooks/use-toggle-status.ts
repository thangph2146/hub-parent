import { useCallback, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/lib/api/axios"
import { getErrorMessage } from "@/lib/utils"
import { resourceLogger } from "@/lib/config/resource-logger"
import type { ResourceRefreshHandler } from "../types"
import { toast } from "@/hooks/use-toast"
import type { QueryKey } from "@tanstack/react-query"

export interface UseToggleStatusConfig<TRow extends { id: string }> {
  resourceName: string
  updateRoute: (id: string) => string
  queryKeys: {
    all: () => QueryKey
    detail: (id: string) => QueryKey
  }
  messages: {
    TOGGLE_ACTIVE_SUCCESS: string
    TOGGLE_ACTIVE_ERROR: string
    TOGGLE_INACTIVE_SUCCESS?: string
    TOGGLE_INACTIVE_ERROR?: string
    NO_PERMISSION: string
    NO_MANAGE_PERMISSION?: string
    UNKNOWN_ERROR: string
  }
  getRecordName: (row: TRow) => string
  canManage: boolean
  validateToggle?: (row: TRow, newStatus: boolean) => { valid: boolean; error?: string }
  onSuccess?: (row: TRow, newStatus: boolean) => void | Promise<void>
}

export const useToggleStatus = <TRow extends { id: string }>(
  config: UseToggleStatusConfig<TRow>
) => {
  const queryClient = useQueryClient()
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set())

  const handleToggleStatus = useCallback(
    async (row: TRow, newStatus: boolean, _refresh: ResourceRefreshHandler) => {
      const startTime = Date.now()
      const recordName = config.getRecordName(row)
      const actionType = newStatus ? "toggle-active" : "toggle-inactive"
      
      // Log bắt đầu toggle action
      resourceLogger.actionFlow({
        resource: config.resourceName,
        action: "toggle-status",
        step: "start",
        metadata: {
          resourceId: row.id,
          recordName,
          newStatus,
          actionType,
          currentStatus: (row as { isActive?: boolean }).isActive,
          userAction: "user_confirmed_toggle",
        },
      })

      if (!config.canManage) {
        const errorMsg = config.messages.NO_MANAGE_PERMISSION || config.messages.NO_PERMISSION
        resourceLogger.actionFlow({
          resource: config.resourceName,
          action: "toggle-status",
          step: "error",
          metadata: {
            resourceId: row.id,
            recordName,
            newStatus,
            error: "NO_PERMISSION",
            errorMessage: errorMsg,
            duration: Date.now() - startTime,
          },
        })
        toast({
          variant: "destructive",
          title: config.messages.NO_PERMISSION,
          description: errorMsg,
        })
        return
      }

      if (config.validateToggle) {
        const validation = config.validateToggle(row, newStatus)
        if (!validation.valid) {
          resourceLogger.actionFlow({
            resource: config.resourceName,
            action: "toggle-status",
            step: "error",
            metadata: {
              resourceId: row.id,
              recordName,
              newStatus,
              error: "VALIDATION_FAILED",
              errorMessage: validation.error,
              duration: Date.now() - startTime,
            },
          })
          toast({
            variant: "destructive",
            title: validation.error || config.messages.NO_PERMISSION,
            description: validation.error,
          })
          return
        }
      }

      setTogglingIds((prev) => new Set(prev).add(row.id))

      // Hiển thị toast loading khi đang thay đổi trạng thái
      const loadingToast = toast({
        title: "Đang thay đổi trạng thái...",
        description: `Đang ${newStatus ? "kích hoạt" : "vô hiệu hóa"} ${recordName}`,
      })

      try {
        // Log trước khi gọi API
        resourceLogger.actionFlow({
          resource: config.resourceName,
          action: "toggle-status",
          step: "init",
          metadata: {
            resourceId: row.id,
            recordName,
            newStatus,
            actionType,
            apiRoute: config.updateRoute(row.id),
            apiPayload: { isActive: newStatus },
          },
        })

        // Gọi API để toggle status
        const apiStartTime = Date.now()
        await apiClient.put(config.updateRoute(row.id), { isActive: newStatus })
        const apiDuration = Date.now() - apiStartTime

        // Log sau khi API thành công
        resourceLogger.actionFlow({
          resource: config.resourceName,
          action: "toggle-status",
          step: "success",
          metadata: {
            resourceId: row.id,
            recordName,
            newStatus,
            actionType,
            apiDuration,
            apiSuccess: true,
          },
        })

        const successTitle = newStatus
          ? config.messages.TOGGLE_ACTIVE_SUCCESS
          : config.messages.TOGGLE_INACTIVE_SUCCESS || config.messages.TOGGLE_ACTIVE_SUCCESS
        const description = `Đã ${newStatus ? "kích hoạt" : "vô hiệu hóa"} ${recordName}`

        // Dismiss loading toast và hiển thị success toast
        loadingToast.dismiss()
        toast({
          variant: "success",
          title: successTitle,
          description: description,
        })

        // Log trước khi invalidate queries
        resourceLogger.actionFlow({
          resource: config.resourceName,
          action: "toggle-status",
          step: "init",
          metadata: {
            resourceId: row.id,
            recordName,
            newStatus,
            operation: "invalidate_queries",
            allQueryKey: config.queryKeys.all(),
            detailQueryKey: config.queryKeys.detail(row.id),
          },
        })

        // Chỉ invalidate queries - table sẽ tự động refresh qua query cache events
        // Không cần gọi refresh callback vì useResourceTableRefresh đã listen query invalidation events
        const invalidateStartTime = Date.now()
        await queryClient.invalidateQueries({ queryKey: config.queryKeys.all(), refetchType: "active" })
        await queryClient.invalidateQueries({ queryKey: config.queryKeys.detail(row.id), refetchType: "active" })
        const invalidateDuration = Date.now() - invalidateStartTime

        resourceLogger.actionFlow({
          resource: config.resourceName,
          action: "toggle-status",
          step: "init",
          metadata: {
            resourceId: row.id,
            recordName,
            newStatus,
            operation: "invalidate_queries_completed",
            invalidateDuration,
            note: "Table will auto-refresh via query cache events listener",
          },
        })

        // Gọi onSuccess callback nếu có
        if (config.onSuccess) {
          const onSuccessStartTime = Date.now()
          await config.onSuccess?.(row, newStatus)
          const onSuccessDuration = Date.now() - onSuccessStartTime

          resourceLogger.actionFlow({
            resource: config.resourceName,
            action: "toggle-status",
            step: "init",
            metadata: {
              resourceId: row.id,
              recordName,
              newStatus,
              operation: "onSuccess_callback",
              onSuccessDuration,
            },
          })
        }

        // Log hoàn thành toggle action
        resourceLogger.actionFlow({
          resource: config.resourceName,
          action: "toggle-status",
          step: "end",
          metadata: {
            resourceId: row.id,
            recordName,
            newStatus,
            actionType,
            totalDuration: Date.now() - startTime,
            apiDuration,
            invalidateDuration,
          },
        })

        // Log table action để tracking
        resourceLogger.tableAction({
          resource: config.resourceName,
          action: "toggle-status",
          resourceId: row.id,
          view: newStatus ? "active" : "inactive",
        })
      } catch (error: unknown) {
        const errorMessage = getErrorMessage(error) || config.messages.UNKNOWN_ERROR
        const errorTitle = newStatus
          ? config.messages.TOGGLE_ACTIVE_ERROR
          : config.messages.TOGGLE_INACTIVE_ERROR || config.messages.TOGGLE_ACTIVE_ERROR
        const description = `Không thể ${newStatus ? "kích hoạt" : "vô hiệu hóa"}. Vui lòng thử lại.`

        // Log lỗi
        resourceLogger.actionFlow({
          resource: config.resourceName,
          action: "toggle-status",
          step: "error",
          metadata: {
            resourceId: row.id,
            recordName,
            newStatus,
            actionType,
            error: "API_ERROR",
            errorMessage,
            errorTitle,
            duration: Date.now() - startTime,
          },
        })

        // Dismiss loading toast và hiển thị error toast
        loadingToast.dismiss()
        toast({
          variant: "destructive",
          title: errorTitle,
          description: description,
        })
      } finally {
        setTogglingIds((prev) => {
          const next = new Set(prev)
          next.delete(row.id)
          return next
        })
      }
    },
    [config, queryClient]
  )

  return {
    handleToggleStatus,
    togglingIds,
  }
}

