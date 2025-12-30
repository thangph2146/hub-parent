import { useCallback, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/lib/api/axios"
import { getErrorMessage, invalidateAndRefetchQueries } from "@/lib/utils"
import type { ResourceRefreshHandler } from "../types"
import type { FeedbackVariant } from "@/components/dialogs"
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
  showFeedback: (variant: FeedbackVariant, title: string, description?: string, details?: string) => void
  validateToggle?: (row: TRow, newStatus: boolean) => { valid: boolean; error?: string }
  onSuccess?: (row: TRow, newStatus: boolean) => void | Promise<void>
}

export const useToggleStatus = <TRow extends { id: string }>(
  config: UseToggleStatusConfig<TRow>
) => {
  const queryClient = useQueryClient()
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set())

  const handleToggleStatus = useCallback(
    async (row: TRow, newStatus: boolean, refresh: ResourceRefreshHandler) => {
      if (!config.canManage) {
        const errorMsg = config.messages.NO_MANAGE_PERMISSION || config.messages.NO_PERMISSION
        config.showFeedback("error", config.messages.NO_PERMISSION, errorMsg)
        return
      }

      if (config.validateToggle) {
        const validation = config.validateToggle(row, newStatus)
        if (!validation.valid) {
          config.showFeedback("error", validation.error || config.messages.NO_PERMISSION, validation.error)
          return
        }
      }

      setTogglingIds((prev) => new Set(prev).add(row.id))

      try {
        await apiClient.put(config.updateRoute(row.id), { isActive: newStatus })

        const successTitle = newStatus
          ? config.messages.TOGGLE_ACTIVE_SUCCESS
          : config.messages.TOGGLE_INACTIVE_SUCCESS || config.messages.TOGGLE_ACTIVE_SUCCESS
        const recordName = config.getRecordName(row)
        const description = `Đã ${newStatus ? "kích hoạt" : "vô hiệu hóa"} ${recordName}`

        config.showFeedback("success", successTitle, description)

        await invalidateAndRefetchQueries(queryClient, config.queryKeys.all())
        await invalidateAndRefetchQueries(queryClient, config.queryKeys.detail(row.id))
        await refresh()

        await config.onSuccess?.(row, newStatus)
      } catch (error: unknown) {
        const errorMessage = getErrorMessage(error) || config.messages.UNKNOWN_ERROR
        const errorTitle = newStatus
          ? config.messages.TOGGLE_ACTIVE_ERROR
          : config.messages.TOGGLE_INACTIVE_ERROR || config.messages.TOGGLE_ACTIVE_ERROR
        const description = `Không thể ${newStatus ? "kích hoạt" : "vô hiệu hóa"}. Vui lòng thử lại.`

        config.showFeedback("error", errorTitle, description, errorMessage)
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

