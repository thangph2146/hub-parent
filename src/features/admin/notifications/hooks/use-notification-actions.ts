import { useCallback, useState } from "react"
import { useSession } from "next-auth/react"
import { useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/services/api/axios"
import { apiRoutes } from "@/constants"
import { queryKeys } from "@/constants"
import { useDeleteNotification } from "@/hooks"
import { useResourceBulkProcessing } from "@/features/admin/resources/hooks"
import type { FeedbackVariant } from "@/components/dialogs"
import type { NotificationRow } from "../types"
import { NOTIFICATION_MESSAGES } from "../constants"
import { toast } from "@/hooks"
import { invalidateAndRefreshResource } from "@/features/admin/resources/utils"

interface ApiError {
  response?: {
    data?: {
      message?: string
    }
  }
}

const getErrorMessage = (error: unknown, defaultMessage: string): string => 
  (error as ApiError)?.response?.data?.message || defaultMessage

interface UseNotificationActionsOptions {
  showFeedback: (variant: FeedbackVariant, title: string, description?: string, details?: string) => void
  // triggerTableRefresh đã được loại bỏ vì registry đã trigger refresh tự động
}

export const useNotificationActions = ({
  showFeedback,
}: UseNotificationActionsOptions) => {
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  const deleteNotificationMutation = useDeleteNotification()
  const [togglingNotifications, setTogglingNotifications] = useState<Set<string>>(new Set())
  const [markingReadNotifications, setMarkingReadNotifications] = useState<Set<string>>(new Set())
  const [markingUnreadNotifications, setMarkingUnreadNotifications] = useState<Set<string>>(new Set())
  const [deletingNotifications, setDeletingNotifications] = useState<Set<string>>(new Set())

  const { bulkState, startBulkProcessing, stopBulkProcessing } = useResourceBulkProcessing()

  const handleToggleRead = useCallback(
    async (row: NotificationRow, newStatus: boolean) => {
      const isOwner = session?.user?.id === row.userId
      
      if (!isOwner) {
        // Cả mark-read và mark-unread đều sử dụng toast
        toast({
          variant: "destructive",
          title: NOTIFICATION_MESSAGES.NO_PERMISSION,
          description: NOTIFICATION_MESSAGES.NO_OWNER_PERMISSION,
        })
        return
      }

      // Track loading state
      const setLoadingState = newStatus ? setMarkingReadNotifications : setMarkingUnreadNotifications
      const updateLoadingState = (prev: Set<string>) => new Set(prev).add(row.id)
      setTogglingNotifications(updateLoadingState)
      setLoadingState(updateLoadingState)

      // Hiển thị loading toast cho cả mark-read và mark-unread
      const loadingToastId = toast({
        title: newStatus ? "Đang đánh dấu đã đọc..." : "Đang đánh dấu chưa đọc...",
        description: "Vui lòng đợi trong giây lát.",
      })

      try {
        await apiClient.patch(apiRoutes.notifications.markRead(row.id), { isRead: newStatus })
        
        // Sử dụng utility function chung để invalidate và trigger registry refresh
        // Đảm bảo UI tự động cập nhật ngay lập tức sau khi mutation thành công
        await invalidateAndRefreshResource({
          queryClient,
          allQueryKey: queryKeys.notifications.admin(),
        })
        
        // Cả mark-read và mark-unread đều sử dụng toast
        loadingToastId.dismiss()
        toast({
          variant: "success",
          title: newStatus ? NOTIFICATION_MESSAGES.MARK_READ_SUCCESS : NOTIFICATION_MESSAGES.MARK_UNREAD_SUCCESS,
          description: newStatus 
            ? "Thông báo đã được đánh dấu là đã đọc."
            : "Thông báo đã được đánh dấu là chưa đọc.",
        })
      } catch (error: unknown) {
        const defaultMessage = newStatus
          ? "Không thể đánh dấu đã đọc thông báo."
          : "Không thể đánh dấu chưa đọc thông báo."
        const errorMessage = getErrorMessage(error, defaultMessage)
        
        // Cả mark-read và mark-unread đều sử dụng toast
        loadingToastId.dismiss()
        toast({
          variant: "destructive",
          title: newStatus ? NOTIFICATION_MESSAGES.MARK_READ_ERROR : NOTIFICATION_MESSAGES.MARK_UNREAD_ERROR,
          description: errorMessage,
        })
      } finally {
        const removeFromSet = (prev: Set<string>) => {
          const next = new Set(prev)
          next.delete(row.id)
          return next
        }
        setTogglingNotifications(removeFromSet)
        setLoadingState(removeFromSet)
      }
    },
    [session?.user?.id, queryClient],
  )

  const handleBulkMarkAsRead = useCallback(
    async (ids: string[], rows?: NotificationRow[]) => {
      if (!session?.user?.id) {
        toast({
          variant: "destructive",
          title: "Lỗi",
          description: NOTIFICATION_MESSAGES.LOGIN_REQUIRED,
        })
        return
      }

      let targetNotificationIds = ids
      let alreadyReadCount = 0

      if (rows) {
        const ownNotifications = rows.filter((row) => row.userId === session.user.id)
        const unreadNotifications = ownNotifications.filter((row) => !row.isRead)
        alreadyReadCount = ownNotifications.length - unreadNotifications.length
        targetNotificationIds = unreadNotifications.map((row) => row.id)

        if (targetNotificationIds.length === 0) {
          toast({
            variant: "destructive",
            title: NOTIFICATION_MESSAGES.NO_NOTIFICATIONS_TO_MARK,
            description: alreadyReadCount > 0
              ? NOTIFICATION_MESSAGES.ALL_ALREADY_READ
              : NOTIFICATION_MESSAGES.NO_OWNER_PERMISSION,
          })
          return
        }
      }

      // Hiển thị loading toast
      const loadingToastId = toast({
        title: "Đang đánh dấu đã đọc...",
        description: `Đang xử lý ${targetNotificationIds.length} thông báo.`,
      })

      try {
        startBulkProcessing()
        const response = await apiClient.post<{
          success: boolean
          data?: { count: number }
          error?: string
          message?: string
        }>(apiRoutes.notifications.bulk, {
          action: "mark-read",
          ids: targetNotificationIds,
        })

        const count = response.data.data?.count ?? 0

        // Dismiss loading toast
        loadingToastId.dismiss()

        if (count > 0) {
          // Sử dụng utility function chung để invalidate và trigger registry refresh
          // Đảm bảo UI tự động cập nhật ngay lập tức sau khi mutation thành công
          await invalidateAndRefreshResource({
            queryClient,
            allQueryKey: queryKeys.notifications.admin(),
          })
          
          toast({
            variant: "success",
            title: NOTIFICATION_MESSAGES.BULK_MARK_READ_SUCCESS,
            description: `Đã đánh dấu ${count} thông báo là đã đọc.`,
          })
        } else {
          toast({
            variant: "destructive",
            title: NOTIFICATION_MESSAGES.NO_CHANGES,
            description: alreadyReadCount > 0
              ? NOTIFICATION_MESSAGES.ALL_ALREADY_READ
              : response.data.message || NOTIFICATION_MESSAGES.NO_NOTIFICATIONS_UPDATED,
          })
        }
      } catch (error: unknown) {
        // Dismiss loading toast
        loadingToastId.dismiss()
        
        const errorMessage = getErrorMessage(error, "Không thể đánh dấu đã đọc các thông báo.")
        toast({
          variant: "destructive",
          title: NOTIFICATION_MESSAGES.BULK_MARK_READ_ERROR,
          description: errorMessage,
        })
      } finally {
        stopBulkProcessing()
      }
    },
    [session?.user?.id, startBulkProcessing, stopBulkProcessing, queryClient],
  )

  const handleBulkMarkAsUnread = useCallback(
    async (ids: string[], rows?: NotificationRow[]) => {
      if (!session?.user?.id) {
        toast({
          variant: "destructive",
          title: "Lỗi",
          description: NOTIFICATION_MESSAGES.LOGIN_REQUIRED,
        })
        return
      }

      let targetNotificationIds = ids
      let alreadyUnreadCount = 0

      if (rows) {
        const ownNotifications = rows.filter((row) => row.userId === session.user.id)
        const readNotifications = ownNotifications.filter((row) => row.isRead)
        alreadyUnreadCount = ownNotifications.length - readNotifications.length
        targetNotificationIds = readNotifications.map((row) => row.id)

        if (targetNotificationIds.length === 0) {
          toast({
            variant: "destructive",
            title: NOTIFICATION_MESSAGES.NO_NOTIFICATIONS_TO_MARK,
            description: alreadyUnreadCount > 0
              ? NOTIFICATION_MESSAGES.ALL_ALREADY_UNREAD
              : NOTIFICATION_MESSAGES.NO_OWNER_PERMISSION,
          })
          return
        }
      }

      // Hiển thị loading toast
      const loadingToastId = toast({
        title: "Đang đánh dấu chưa đọc...",
        description: `Đang xử lý ${targetNotificationIds.length} thông báo.`,
      })

      try {
        startBulkProcessing()
        const response = await apiClient.post<{
          success: boolean
          data?: { count: number }
          error?: string
          message?: string
        }>(apiRoutes.notifications.bulk, {
          action: "mark-unread",
          ids: targetNotificationIds,
        })

        const count = response.data.data?.count ?? 0

        // Dismiss loading toast
        loadingToastId.dismiss()

        if (count > 0) {
          // Sử dụng utility function chung để invalidate và trigger registry refresh
          // Đảm bảo UI tự động cập nhật ngay lập tức sau khi mutation thành công
          await invalidateAndRefreshResource({
            queryClient,
            allQueryKey: queryKeys.notifications.admin(),
          })
          
          toast({
            variant: "success",
            title: NOTIFICATION_MESSAGES.BULK_MARK_UNREAD_SUCCESS,
            description: `Đã đánh dấu ${count} thông báo là chưa đọc.`,
          })
        } else {
          toast({
            variant: "destructive",
            title: NOTIFICATION_MESSAGES.NO_CHANGES,
            description: alreadyUnreadCount > 0
              ? NOTIFICATION_MESSAGES.ALL_ALREADY_UNREAD
              : response.data.message || NOTIFICATION_MESSAGES.NO_NOTIFICATIONS_UPDATED,
          })
        }
      } catch (error: unknown) {
        // Dismiss loading toast
        loadingToastId.dismiss()
        
        const errorMessage = getErrorMessage(error, "Không thể đánh dấu chưa đọc các thông báo.")
        toast({
          variant: "destructive",
          title: NOTIFICATION_MESSAGES.BULK_MARK_UNREAD_ERROR,
          description: errorMessage,
        })
      } finally {
        stopBulkProcessing()
      }
    },
    [session?.user?.id, startBulkProcessing, stopBulkProcessing, queryClient],
  )

  const handleDeleteSingle = useCallback(
    async (row: NotificationRow) => {
      const isOwner = session?.user?.id === row.userId
      
      if (!isOwner) {
        showFeedback("error", NOTIFICATION_MESSAGES.NO_PERMISSION, NOTIFICATION_MESSAGES.NO_DELETE_PERMISSION)
        return
      }

      if (row.kind === "SYSTEM") {
        showFeedback("error", "Không thể xóa", NOTIFICATION_MESSAGES.NO_DELETE_SYSTEM)
        return
      }

      setDeletingNotifications((prev) => new Set(prev).add(row.id))

      try {
        await deleteNotificationMutation.mutateAsync(row.id)
        
        // Sử dụng utility function chung để invalidate và trigger registry refresh
        // Đảm bảo UI tự động cập nhật ngay lập tức sau khi mutation thành công
        await invalidateAndRefreshResource({
          queryClient,
          allQueryKey: queryKeys.notifications.admin(),
        })
        
        showFeedback("success", NOTIFICATION_MESSAGES.DELETE_SUCCESS, "Thông báo đã được xóa thành công.")
      } catch (error: unknown) {
        const errorMessage = getErrorMessage(error, "Không thể xóa thông báo.")
        showFeedback("error", NOTIFICATION_MESSAGES.DELETE_ERROR, errorMessage)
      } finally {
        setDeletingNotifications((prev) => {
          const next = new Set(prev)
          next.delete(row.id)
          return next
        })
      }
    },
    [showFeedback, session?.user?.id, deleteNotificationMutation, queryClient],
  )

  const handleBulkDelete = useCallback(
    async (ids: string[], rows?: NotificationRow[]) => {
      if (!session?.user?.id) {
        showFeedback("error", "Lỗi", NOTIFICATION_MESSAGES.LOGIN_REQUIRED)
        return
      }

      let deletableNotificationIds: string[]
      let systemCount = 0
      let otherCount = 0

      if (rows) {
        const ownNotifications = rows.filter((row) => row.userId === session.user.id)
        otherCount = rows.length - ownNotifications.length
        
        const nonSystemNotifications = ownNotifications.filter((row) => row.kind !== "SYSTEM")
        systemCount = ownNotifications.length - nonSystemNotifications.length
        
        deletableNotificationIds = nonSystemNotifications.map((row) => row.id)
      } else {
        deletableNotificationIds = ids
      }

      if (deletableNotificationIds.length === 0) {
        if (systemCount > 0) {
          showFeedback("error", "Không thể xóa", NOTIFICATION_MESSAGES.NO_DELETE_SYSTEM)
        } else {
          showFeedback("error", NOTIFICATION_MESSAGES.NO_PERMISSION, NOTIFICATION_MESSAGES.NO_DELETE_PERMISSION)
        }
        return
      }

      try {
        startBulkProcessing()
        const response = await apiClient.delete<{
          success: boolean
          data?: { count: number }
          error?: string
          message?: string
        }>(apiRoutes.notifications.deleteAll, {
          data: { ids: deletableNotificationIds },
        })

        const deletedCount = response.data.data?.count || 0

        if (deletedCount > 0) {
          // Sử dụng utility function chung để invalidate và trigger registry refresh
          // Đảm bảo UI tự động cập nhật ngay lập tức sau khi mutation thành công
          await invalidateAndRefreshResource({
            queryClient,
            allQueryKey: queryKeys.notifications.admin(),
          })
          
          let message = `Đã xóa ${deletedCount} thông báo.`
          if (systemCount > 0) {
            message += ` ${systemCount} thông báo hệ thống đã được bỏ qua.`
          }
          if (otherCount > 0) {
            message += ` ${otherCount} thông báo không thuộc về bạn đã được bỏ qua.`
          }
          showFeedback("success", NOTIFICATION_MESSAGES.BULK_DELETE_SUCCESS, message)
        } else {
          showFeedback("error", "Lỗi", NOTIFICATION_MESSAGES.NO_DELETE_OTHER)
        }
      } catch (error: unknown) {
        const errorMessage = getErrorMessage(error, "Không thể xóa các thông báo.")
        showFeedback("error", NOTIFICATION_MESSAGES.BULK_DELETE_ERROR, errorMessage)
      } finally {
        stopBulkProcessing()
      }
    },
    [showFeedback, session?.user?.id, startBulkProcessing, stopBulkProcessing, queryClient],
  )

  return {
    handleToggleRead,
    handleBulkMarkAsRead,
    handleBulkMarkAsUnread,
    handleDeleteSingle,
    handleBulkDelete,
    togglingNotifications,
    markingReadNotifications,
    markingUnreadNotifications,
    deletingNotifications,
    bulkState,
  }
}

