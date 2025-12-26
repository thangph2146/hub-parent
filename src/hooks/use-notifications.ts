/**
 * Hook để quản lý notifications với TanStack Query
 */
"use client"

import { useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useSession } from "next-auth/react"
import { apiClient } from "@/lib/api/axios"
import { useSocket, type SocketNotificationPayload } from "@/hooks/use-socket"
import { queryKeys, invalidateQueries } from "@/lib/query-keys"
import { apiRoutes } from "@/lib/api/routes"
import { logger } from "@/lib/config"
import { resourceRefreshRegistry } from "@/features/admin/resources/hooks/resource-refresh-registry"
import type { UnreadCountsResponse } from "@/hooks/use-unread-counts"

/**
 * Helper to extract payload from API response or throw error
 */
const getPayloadOrThrow = <T>(
  response: { data: { data?: T; error?: string; message?: string } },
  errorMessage: string,
  context?: Record<string, unknown>
): T => {
  const payload = response.data.data
  if (!payload) {
    const error = response.data.error || response.data.message || errorMessage
    if (context) {
      logger.error(errorMessage, { ...context, error })
    }
    throw new Error(error)
  }
  return payload
}

/**
 * Helper to create default UnreadCountsResponse
 */
const createDefaultUnreadCounts = (notifications: number = 0): UnreadCountsResponse => ({
  unreadMessages: 0,
  unreadNotifications: notifications,
  contactRequests: 0,
})

/**
 * Helper to get unread counts query key
 */
const getUnreadCountsKey = (userId: string | undefined) =>
  queryKeys.unreadCounts.user(userId) as unknown[]

/**
 * Helper to get all user notifications query key
 */
const getAllUserNotificationsKey = (userId: string | undefined) =>
  queryKeys.notifications.allUser(userId) as unknown[]

/**
 * Check if user is protected super admin
 */
const isProtectedSuperAdmin = (email: string | undefined | null): boolean =>
  email === "superadmin@hub.edu.vn"

export interface Notification {
  id: string
  userId: string
  kind: "MESSAGE" | "SYSTEM" | "ANNOUNCEMENT" | "ALERT" | "WARNING" | "SUCCESS" | "INFO"
  title: string
  description: string | null
  isRead: boolean
  actionUrl: string | null
  metadata: Record<string, unknown> | null
  expiresAt: Date | null
  createdAt: Date
  updatedAt: Date
  readAt: Date | null
}

export interface NotificationsResponse {
  notifications: Notification[]
  total: number
  unreadCount: number
  hasMore: boolean
}

/**
 * Helper function để parse notification dates từ API response
 */
const parseNotificationDates = (notification: {
  createdAt: string | Date
  updatedAt: string | Date
  expiresAt?: string | Date | null
  readAt?: string | Date | null
}): {
  createdAt: Date
  updatedAt: Date
  expiresAt: Date | null
  readAt: Date | null
} => ({
  createdAt: notification.createdAt instanceof Date ? notification.createdAt : new Date(notification.createdAt),
  updatedAt: notification.updatedAt instanceof Date ? notification.updatedAt : new Date(notification.updatedAt),
  expiresAt: notification.expiresAt ? (notification.expiresAt instanceof Date ? notification.expiresAt : new Date(notification.expiresAt)) : null,
  readAt: notification.readAt ? (notification.readAt instanceof Date ? notification.readAt : new Date(notification.readAt)) : null,
})

/**
 * Hook để fetch notifications với pagination và filters
 * @param options - Options cho việc fetch notifications
 * @param options.limit - Số lượng notifications mỗi lần fetch (default: 20)
 * @param options.offset - Offset cho pagination (default: 0)
 * @param options.unreadOnly - Chỉ fetch unread notifications (default: false)
 * @param options.refetchInterval - Interval để refetch (default: 30000ms)
 * @param options.disablePolling - Tắt polling khi có socket connection (default: false)
 */
export const useNotifications = (options?: {
  limit?: number
  offset?: number
  unreadOnly?: boolean
  refetchInterval?: number
  disablePolling?: boolean
}) => {
  const { data: session } = useSession()
  const { limit = 20, offset = 0, unreadOnly = false, refetchInterval = 30000, disablePolling = false } = options || {}

  return useQuery<NotificationsResponse>({
    queryKey: queryKeys.notifications.user(session?.user?.id, { limit, offset, unreadOnly }),
    queryFn: async () => {
      const response = await apiClient.get<{
        success: boolean
        data?: NotificationsResponse
        error?: string
        message?: string
      }>(apiRoutes.notifications.list({ limit, offset, unreadOnly }))

      const payload = getPayloadOrThrow<NotificationsResponse>(
        response,
        "Không thể tải thông báo",
        { userId: session?.user?.id, source: "useNotifications" }
      )

      return {
        ...payload,
        notifications: payload.notifications.map((notification) => ({
          ...notification,
          ...parseNotificationDates(notification),
        })),
      }
    },
    enabled: !!session?.user?.id,
    // Chỉ polling nếu không có socket connection (disablePolling = false)
    // Socket sẽ handle real-time updates, polling chỉ là fallback
    refetchInterval: disablePolling ? false : refetchInterval,
    // Tăng staleTime để giảm refetch không cần thiết
    // staleTime phải LỚN HƠN refetchInterval để tránh refetch liên tục
    // Nếu staleTime <= refetchInterval, React Query sẽ refetch ngay khi data stale
    staleTime: disablePolling ? 300000 : Math.max(refetchInterval * 2, 60000), // 300s (5 phút) nếu có socket, ít nhất 2x refetchInterval nếu không
    // Tăng gcTime để cache lâu hơn
    gcTime: 10 * 60 * 1000, // 10 phút
    // Tránh refetch khi component remount hoặc window focus
    refetchOnWindowFocus: false,
    refetchOnMount: false, // Không refetch khi mount - chỉ dựa vào staleTime và refetchInterval
    refetchOnReconnect: false, // Không refetch khi reconnect - socket sẽ handle
  })
}

/**
 * Hook để đánh dấu notification là đã đọc/chưa đọc
 * Tự động invalidate queries sau khi thành công
 */
export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient()
  const { data: session } = useSession()

  return useMutation({
    mutationFn: async ({ id, isRead = true }: { id: string; isRead?: boolean }) => {
      logger.debug("useMarkNotificationRead: Marking notification", {
        notificationId: id,
        isRead,
        userId: session?.user?.id,
      })
      
      const response = await apiClient.patch<{
        success: boolean
        data?: Notification
        error?: string
        message?: string
      }>(apiRoutes.notifications.markRead(id), { isRead })

      const payload = getPayloadOrThrow<Notification>(
        response,
        "Không thể cập nhật thông báo",
        { notificationId: id, userId: session?.user?.id, source: "useMarkNotificationRead" }
      )

      logger.success("useMarkNotificationRead: Notification marked successfully", {
        notificationId: id,
        isRead: payload.isRead,
        userId: session?.user?.id,
      })

      return {
        ...payload,
        ...parseNotificationDates(payload),
      }
    },
    onSuccess: async () => {
      // Invalidate cả user và admin notifications vì thay đổi trạng thái đọc ảnh hưởng đến cả 2
      // Admin table cần cập nhật ngay khi notification được đánh dấu đã đọc/chưa đọc
      // Cũng invalidate unreadCounts để cập nhật badge count trong nav-main-with-badges
      invalidateQueries.notificationsAndCounts(queryClient, session?.user?.id)
      
      // Refetch admin queries để đảm bảo UI cập nhật ngay lập tức
      await queryClient.refetchQueries({ 
        queryKey: queryKeys.notifications.admin(), 
        type: "all" 
      })
      
      // Trigger UI refresh cho notification page thông qua registry
      // Đảm bảo notification page và bell đồng bộ với nhau
      resourceRefreshRegistry.triggerRefresh(queryKeys.notifications.admin())
    },
  })
}

/**
 * Hook để xóa một notification
 * Tự động invalidate queries sau khi thành công
 */
export const useDeleteNotification = () => {
  const queryClient = useQueryClient()
  const { data: session } = useSession()

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(apiRoutes.notifications.delete(id))
      return id
    },
    onSuccess: async () => {
      // Invalidate cả user và admin notifications vì xóa notification ảnh hưởng đến cả 2
      invalidateQueries.allNotifications(queryClient, session?.user?.id)
      
      // Refetch admin queries để đảm bảo UI cập nhật ngay lập tức
      await queryClient.refetchQueries({ 
        queryKey: queryKeys.notifications.admin(), 
        type: "all" 
      })
      
      // Trigger UI refresh cho notification page thông qua registry
      // Đảm bảo notification page và bell đồng bộ với nhau
      resourceRefreshRegistry.triggerRefresh(queryKeys.notifications.admin())
    },
    onError: (error: unknown) => {
      logger.error("Error deleting notification", { error, userId: session?.user?.id })
    },
  })
}

/**
 * Hook để đánh dấu tất cả notifications là đã đọc
 * Tự động invalidate queries sau khi thành công
 */
export const useMarkAllAsRead = () => {
  const queryClient = useQueryClient()
  const { data: session } = useSession()

  return useMutation({
    mutationFn: async () => {
      logger.debug("useMarkAllAsRead: Marking all as read", {
        userId: session?.user?.id,
      })
      
      const response = await apiClient.post<{
        success: boolean
        data?: { count: number }
        error?: string
        message?: string
      }>(apiRoutes.notifications.markAllRead)

      const payload = getPayloadOrThrow<{ count: number }>(
        response,
        "Không thể đánh dấu tất cả đã đọc",
        { userId: session?.user?.id, source: "useMarkAllAsRead" }
      )
      
      logger.success("useMarkAllAsRead: All notifications marked as read", {
        count: payload.count,
        userId: session?.user?.id,
      })
      
      return payload
    },
    onSuccess: async () => {
      // Invalidate cả user và admin notifications vì đánh dấu tất cả đã đọc ảnh hưởng đến cả 2
      // Admin table cần cập nhật ngay khi tất cả notifications được đánh dấu đã đọc
      // Cũng invalidate unreadCounts để cập nhật badge count trong nav-main-with-badges
      invalidateQueries.notificationsAndCounts(queryClient, session?.user?.id)
      
      // Refetch admin queries để đảm bảo UI cập nhật ngay lập tức
      await queryClient.refetchQueries({ 
        queryKey: queryKeys.notifications.admin(), 
        type: "all" 
      })
      
      // Trigger UI refresh cho notification page thông qua registry
      // Đảm bảo notification page và bell đồng bộ với nhau
      resourceRefreshRegistry.triggerRefresh(queryKeys.notifications.admin())
    },
  })
}

/**
 * Hook để xóa tất cả notifications
 * Tự động invalidate queries sau khi thành công
 */
export const useDeleteAllNotifications = () => {
  const queryClient = useQueryClient()
  const { data: session } = useSession()

  return useMutation({
    mutationFn: async () => {
      const response = await apiClient.delete<{
        success: boolean
        data?: { count: number }
        error?: string
        message?: string
      }>(apiRoutes.notifications.deleteAll)

      return getPayloadOrThrow<{ count: number }>(
        response,
        "Không thể xóa tất cả thông báo",
        { source: "useDeleteAllNotifications" }
      )
    },
    onSuccess: async () => {
      // Invalidate cả user và admin notifications vì xóa tất cả ảnh hưởng đến cả 2
      invalidateQueries.allNotifications(queryClient, session?.user?.id)
      
      // Refetch admin queries để đảm bảo UI cập nhật ngay lập tức
      await queryClient.refetchQueries({ 
        queryKey: queryKeys.notifications.admin(), 
        type: "all" 
      })
      
      // Trigger UI refresh cho notification page thông qua registry
      // Đảm bảo notification page và bell đồng bộ với nhau
      resourceRefreshRegistry.triggerRefresh(queryKeys.notifications.admin())
    },
    onError: (error: unknown) => {
      logger.error("Error deleting all notifications", { error, userId: session?.user?.id })
    },
  })
}

const registeredUsers = new Set<string>()

/**
 * Hook để quản lý Socket.IO real-time updates cho User Notifications.
 * Tự động cập nhật cache khi có socket events:
 * - notification:new: Khi có notification mới
 * - notification:updated: Khi notification được cập nhật
 * - notifications:sync: Khi có sync request từ server
 */
export const useNotificationsSocketBridge = () => {
  const queryClient = useQueryClient()
  const { data: session } = useSession()
  const primaryRole = session?.roles?.[0]?.name ?? null

  const { socket, onNotification, onNotificationUpdated, onNotificationsSync } = useSocket({
    userId: session?.user?.id,
    role: primaryRole,
  })

  useEffect(() => {
    const userId = session?.user?.id
    if (!userId) return

    // Chỉ đăng ký listener một lần cho mỗi userId
    if (registeredUsers.has(userId)) {
      return
    }
    registeredUsers.add(userId)

    // Helper to check if notification belongs to user
    const isNotificationForUser = (payload: SocketNotificationPayload): boolean =>
      payload.toUserId === userId

    // Helper để convert SocketNotificationPayload sang Notification format
    // QUAN TRỌNG: Sử dụng payload.toUserId để đảm bảo đúng owner
    // vì notification có thể thuộc về user khác (superadmin@hub.edu.vn thấy tất cả)
    const convertSocketToNotification = (payload: SocketNotificationPayload): Notification => {
      const timestamp = payload.timestamp ?? Date.now()
      const kind = typeof payload.kind === "string" ? payload.kind.toUpperCase() : "SYSTEM"
      // Sử dụng payload.toUserId để đảm bảo đúng owner (fallback về userId nếu không có)
      const notificationUserId = payload.toUserId || userId
      return {
        id: payload.id,
        userId: notificationUserId, // QUAN TRỌNG: Sử dụng toUserId từ payload để đảm bảo đúng owner
        kind: kind as Notification["kind"],
        title: payload.title,
        description: payload.description ?? null,
        isRead: payload.read ?? false,
        actionUrl: payload.actionUrl ?? null,
        metadata: payload.metadata ?? null,
        expiresAt: null,
        createdAt: new Date(timestamp),
        updatedAt: new Date(timestamp),
        readAt: payload.read ? new Date(timestamp) : null,
      }
    }

    const getExistingNotificationState = (notificationId: string): { isRead?: boolean } => {
      const existingQueries = queryClient.getQueriesData<NotificationsResponse>({
        queryKey: getAllUserNotificationsKey(userId),
      })

      for (const [, data] of existingQueries) {
        const found = data?.notifications.find((notification) => notification.id === notificationId)
        if (found) {
          return { isRead: found.isRead }
        }
      }

      return {}
    }

    const updateUnreadCountsByDelta = (delta: number) => {
      if (delta === 0) return

      queryClient.setQueryData<UnreadCountsResponse>(
        getUnreadCountsKey(userId),
        (current) => {
          if (!current) {
            if (delta < 0) return undefined
            return createDefaultUnreadCounts(Math.max(0, delta))
          }

          const next = Math.max(0, current.unreadNotifications + delta)
          if (next === current.unreadNotifications) return current

          return { ...current, unreadNotifications: next }
        },
      )
    }

    const setUnreadCountsValue = (value: number) => {
      queryClient.setQueryData<UnreadCountsResponse>(
        getUnreadCountsKey(userId),
        (current) => {
          if (!current) return createDefaultUnreadCounts(value)
          if (current.unreadNotifications === value) return current
          return { ...current, unreadNotifications: value }
        },
      )
    }

    const applyNotificationUpdate = (payload: SocketNotificationPayload) => {
      const notification = convertSocketToNotification(payload)
      const previousState = getExistingNotificationState(notification.id)
      const previousIsRead = previousState.isRead
      const currentIsRead = notification.isRead

      // QUAN TRỌNG: Chỉ tính unreadDelta nếu notification thuộc về user này
      // superadmin@hub.edu.vn có thể thấy tất cả nhưng chỉ đếm của chính mình
      const userEmail = session?.user?.email
      const isSuperAdmin = isProtectedSuperAdmin(userEmail)
      const isOwner = notification.userId === userId
      const shouldCount = isSuperAdmin || isOwner
      
      let unreadDelta = 0
      if (shouldCount) {
        if (previousIsRead === undefined) {
          unreadDelta = currentIsRead ? 0 : 1
        } else if (previousIsRead !== currentIsRead) {
          unreadDelta = currentIsRead ? -1 : 1
        }
      }
      
      logger.debug("useNotificationsSocketBridge: applyNotificationUpdate", {
        notificationId: notification.id,
        userId,
        userEmail,
        notificationUserId: notification.userId,
        isOwner,
        isProtectedSuperAdmin: isSuperAdmin,
        shouldCount,
        previousIsRead,
        currentIsRead,
        unreadDelta,
      })

      queryClient.setQueriesData<NotificationsResponse>(
        { queryKey: getAllUserNotificationsKey(userId) },
        (oldData) => {
          if (!oldData) {
            return oldData
          }

          const capacity = oldData.notifications.length > 0 ? oldData.notifications.length : 20
          const existingIndex = oldData.notifications.findIndex((n) => n.id === notification.id)

          let notifications = oldData.notifications
          let total = oldData.total

          if (existingIndex >= 0) {
            const nextNotifications = [...notifications]
            nextNotifications[existingIndex] = notification
            notifications = nextNotifications
          } else {
            const nextNotifications = [notification, ...notifications]
            notifications = nextNotifications
            total += 1
            if (capacity > 0 && notifications.length > capacity) {
              notifications = notifications.slice(0, capacity)
            }
          }

          const unreadCount = Math.max(0, oldData.unreadCount + unreadDelta)
          const hasMore = oldData.hasMore || total > notifications.length

          return {
            ...oldData,
            notifications,
            total,
            unreadCount,
            hasMore,
          }
        },
      )

      if (unreadDelta !== 0) {
        updateUnreadCountsByDelta(unreadDelta)
      }
    }

    const stopNew = onNotification((payload: SocketNotificationPayload) => {
      // Chỉ update cache nếu notification dành cho user này
      // Không log ở đây để tránh duplicate logs (useAdminNotificationsSocketBridge cũng log)
      if (isNotificationForUser(payload)) {
        applyNotificationUpdate(payload)
      }
    })

    const stopUpdated = onNotificationUpdated((payload: SocketNotificationPayload) => {
      // Chỉ update cache nếu notification dành cho user này
      // Không log ở đây để tránh duplicate logs (useAdminNotificationsSocketBridge cũng log)
      if (isNotificationForUser(payload)) {
        applyNotificationUpdate(payload)
      }
    })

    const stopSync = onNotificationsSync((payloads: SocketNotificationPayload[]) => {
      // Lọc và convert notifications cho user này
      const userNotifications = payloads
        .filter(isNotificationForUser)
        .map(convertSocketToNotification)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      
      // Filter duplicates by ID (quan trọng để tránh duplicate notifications)
      const seen = new Set<string>()
      const uniqueNotifications: Notification[] = []
      const duplicateIds = new Set<string>()
      
      for (const notification of userNotifications) {
        if (!seen.has(notification.id)) {
          seen.add(notification.id)
          uniqueNotifications.push(notification)
        } else {
          duplicateIds.add(notification.id)
        }
      }
      
      if (duplicateIds.size > 0) {
        logger.warn("useNotificationsSocketBridge: Duplicate notifications in sync payload", {
          userId,
          totalPayloads: payloads.length,
          userNotificationsCount: userNotifications.length,
          uniqueCount: uniqueNotifications.length,
          duplicateCount: duplicateIds.size,
          duplicateIds: Array.from(duplicateIds),
        })
      }
      
      // QUAN TRỌNG: Chỉ superadmin@hub.edu.vn mới đếm tất cả notifications
      // Các user khác chỉ đếm notifications của chính họ (owner)
      const userEmail = session?.user?.email
      const isSuperAdmin = isProtectedSuperAdmin(userEmail)
      
      // Filter notifications để đếm unread:
      // - superadmin@hub.edu.vn: đếm tất cả notifications
      // - Các user khác: chỉ đếm notifications của chính họ
      const notificationsForCount = isSuperAdmin
        ? uniqueNotifications
        : uniqueNotifications.filter(n => n.userId === userId)
      
      const unreadCount = notificationsForCount.filter((n) => !n.isRead).length
      const ownedNotificationsCount = uniqueNotifications.filter(n => n.userId === userId).length
      const ownedUnreadCount = uniqueNotifications.filter(n => n.userId === userId && !n.isRead).length
      
      logger.debug("useNotificationsSocketBridge: Processing notifications:sync", {
        userId,
        userEmail,
        isProtectedSuperAdmin: isSuperAdmin,
        totalPayloads: payloads.length,
        userNotificationsCount: userNotifications.length,
        uniqueCount: uniqueNotifications.length,
        ownedNotificationsCount,
        ownedUnreadCount,
        unreadCount,
        note: isSuperAdmin 
          ? "superadmin@hub.edu.vn: đếm tất cả notifications" 
          : "Chỉ đếm notifications của chính user (owner)",
      })
      
      // Update cache với toàn bộ notifications mới (đã filter duplicates)
      queryClient.setQueriesData<NotificationsResponse>(
        { queryKey: getAllUserNotificationsKey(userId) },
        (oldData) => {
          if (!oldData) {
            return {
              notifications: uniqueNotifications.slice(0, 20),
              total: uniqueNotifications.length,
              unreadCount,
              hasMore: uniqueNotifications.length > 20,
            }
          }

          const capacity = oldData.notifications.length > 0 ? oldData.notifications.length : 20
          const limitedNotifications =
            capacity > 0 ? uniqueNotifications.slice(0, capacity) : uniqueNotifications
          const hasMore = uniqueNotifications.length > limitedNotifications.length

          return {
            ...oldData,
            notifications: limitedNotifications,
            total: uniqueNotifications.length,
            unreadCount,
            hasMore,
          }
        },
      )

      // Update unread counts
      setUnreadCountsValue(unreadCount)
    })

    // Xử lý xóa notification đơn lẻ
    const handleNotificationDeleted = (payload: { id?: string; notificationId?: string }) => {
      const notificationId = payload.id || payload.notificationId
      if (!notificationId) return

      let deletedNotification: Notification | undefined

      queryClient.setQueriesData<NotificationsResponse>(
        { queryKey: getAllUserNotificationsKey(userId) },
        (oldData) => {
          if (!oldData) return oldData

          const notification = oldData.notifications.find((n) => n.id === notificationId)
          if (!notification) return oldData

          deletedNotification = notification
          const wasUnread = !notification.isRead
          const newNotifications = oldData.notifications.filter((n) => n.id !== notificationId)
          const newTotal = Math.max(0, oldData.total - 1)
          const newUnreadCount = wasUnread ? Math.max(0, oldData.unreadCount - 1) : oldData.unreadCount

          return {
            ...oldData,
            notifications: newNotifications,
            total: newTotal,
            unreadCount: newUnreadCount,
          }
        },
      )

      // Update unread counts
      if (deletedNotification) {
        updateUnreadCountsByDelta(deletedNotification.isRead ? 0 : -1)
      }
    }

    // Xử lý xóa nhiều notifications
    const handleNotificationsDeleted = (payload: { ids?: string[]; notificationIds?: string[] }) => {
      const notificationIds = payload.ids || payload.notificationIds || []
      if (notificationIds.length === 0) return

      let deletedNotifications: Notification[] = []
      let unreadDeletedCount = 0

      queryClient.setQueriesData<NotificationsResponse>(
        { queryKey: getAllUserNotificationsKey(userId) },
        (oldData) => {
          if (!oldData) return oldData

          deletedNotifications = oldData.notifications.filter((n) => notificationIds.includes(n.id))
          unreadDeletedCount = deletedNotifications.filter((n) => !n.isRead).length
          const newNotifications = oldData.notifications.filter((n) => !notificationIds.includes(n.id))
          const newTotal = Math.max(0, oldData.total - deletedNotifications.length)
          const newUnreadCount = Math.max(0, oldData.unreadCount - unreadDeletedCount)

          return {
            ...oldData,
            notifications: newNotifications,
            total: newTotal,
            unreadCount: newUnreadCount,
          }
        },
      )

      // Update unread counts
      if (unreadDeletedCount > 0) {
        updateUnreadCountsByDelta(-unreadDeletedCount)
      }
    }

    // Đăng ký socket listeners cho delete events
    socket?.on("notification:deleted", handleNotificationDeleted)
    socket?.on("notifications:deleted", handleNotificationsDeleted)

    return () => {
      stopNew?.()
      stopUpdated?.()
      stopSync?.()
      if (socket) {
        socket.off("notification:deleted", handleNotificationDeleted)
        socket.off("notifications:deleted", handleNotificationsDeleted)
      }
      registeredUsers.delete(userId)
    }
  }, [session?.user?.id, session?.user?.email, socket, onNotification, onNotificationUpdated, onNotificationsSync, queryClient])

  return { socket }
}

/**
 * Hook để quản lý Socket.IO real-time updates cho Admin Notifications Table.
 * Tự động invalidate admin notifications queries khi có socket events:
 * - notification:new: Khi có notification mới
 * - notification:updated: Khi notification được cập nhật (đánh dấu đọc/chưa đọc, xóa, etc.)
 * - notifications:sync: Khi có sync request từ server
 * - notification:admin: Khi có notification admin-specific
 */
export const useAdminNotificationsSocketBridge = () => {
  const queryClient = useQueryClient()
  const { data: session } = useSession()
  const primaryRole = session?.roles?.[0]?.name ?? null

  const { socket, onNotification, onNotificationUpdated, onNotificationsSync } = useSocket({
    userId: session?.user?.id,
    role: primaryRole,
  })

  useEffect(() => {
    const userId = session?.user?.id
    if (!userId || !socket) return

    const invalidate = () => {
      // Chỉ invalidate admin notifications; client-side socket bridge đã đồng bộ user notifications
      invalidateQueries.adminNotifications(queryClient)
    }

    const stopNew = onNotification(() => {
      logger.debug("Socket notification:new received (admin)", { userId })
      invalidate()
    })
    const stopUpdated = onNotificationUpdated(() => {
      logger.debug("Socket notification:updated received (admin)", { userId })
      invalidate()
    })
    const stopSync = onNotificationsSync(() => {
      logger.debug("Socket notifications:sync received (admin)", { userId })
      invalidate()
    })

    // Lắng nghe events xóa notification
    const handleDeleted = () => {
      logger.debug("Socket notification:deleted received (admin)", { userId })
      invalidate()
    }
    const handleBulkDeleted = () => {
      logger.debug("Socket notifications:deleted received (admin)", { userId })
      invalidate()
    }

    socket.on("notification:deleted", handleDeleted)
    socket.on("notifications:deleted", handleBulkDeleted)

    return () => {
      stopNew?.()
      stopUpdated?.()
      stopSync?.()
      if (socket) {
        socket.off("notification:deleted", handleDeleted)
        socket.off("notifications:deleted", handleBulkDeleted)
      }
    }
  }, [session?.user?.id, socket, onNotification, onNotificationUpdated, onNotificationsSync, queryClient])

  return { socket }
}

