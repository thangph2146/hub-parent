/**
 * Hook để quản lý notifications với TanStack Query
 */
"use client"

import { useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useSession } from "next-auth/react"
import { apiClient } from "@/lib/api/axios"
import { useSocket } from "@/hooks/use-socket"
import { queryKeys, invalidateQueries } from "@/lib/query-keys"
import { apiRoutes } from "@/lib/api/routes"

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

// Fetch notifications
export function useNotifications(options?: {
  limit?: number
  offset?: number
  unreadOnly?: boolean
  refetchInterval?: number
}) {
  const { data: session } = useSession()
  const { limit = 20, offset = 0, unreadOnly = false, refetchInterval = 30000 } = options || {}

  return useQuery<NotificationsResponse>({
    queryKey: queryKeys.notifications.user(session?.user?.id, { limit, offset, unreadOnly }),
    queryFn: async () => {
      const response = await apiClient.get<NotificationsResponse>(
        apiRoutes.notifications.list({ limit, offset, unreadOnly })
      )
      return response.data
    },
    enabled: !!session?.user?.id,
    refetchInterval: refetchInterval, // Polling mỗi 30 giây
    staleTime: 10000, // 10 giây
  })
}

// Mark notification as read
export function useMarkNotificationRead() {
  const queryClient = useQueryClient()
  const { data: session } = useSession()

  return useMutation({
    mutationFn: async ({ id, isRead = true }: { id: string; isRead?: boolean }) => {
      const response = await apiClient.patch<Notification>(apiRoutes.notifications.markRead(id), { isRead })
      return response.data
    },
    onSuccess: () => {
      // Chỉ invalidate user notifications - admin table sẽ tự refresh khi cần
      // Theo chuẩn Next.js 16: chỉ invalidate những queries thực sự cần thiết
      invalidateQueries.userNotifications(queryClient, session?.user?.id)
    },
  })
}

// Delete notification
export function useDeleteNotification() {
  const queryClient = useQueryClient()
  const { data: session } = useSession()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.delete(apiRoutes.notifications.delete(id))
      return id
    },
    onSuccess: () => {
      // Invalidate cả user và admin notifications vì xóa notification ảnh hưởng đến cả 2
      invalidateQueries.allNotifications(queryClient, session?.user?.id)
    },
    onError: (error: unknown) => {
      // Error message sẽ được hiển thị bởi component sử dụng hook này
      console.error("Error deleting notification:", error)
    },
  })
}

// Mark all as read
export function useMarkAllAsRead() {
  const queryClient = useQueryClient()
  const { data: session } = useSession()

  return useMutation({
    mutationFn: async () => {
      const response = await apiClient.post<{ success: boolean; count: number }>(
        apiRoutes.notifications.markAllRead
      )
      return response.data
    },
    onSuccess: () => {
      // Chỉ invalidate user notifications - admin table sẽ tự refresh khi cần
      invalidateQueries.userNotifications(queryClient, session?.user?.id)
    },
  })
}

// Delete all notifications
export function useDeleteAllNotifications() {
  const queryClient = useQueryClient()
  const { data: session } = useSession()

  return useMutation({
    mutationFn: async () => {
      const response = await apiClient.delete<{ success: boolean; count: number; message: string }>(
        apiRoutes.notifications.deleteAll
      )
      return response.data
    },
    onSuccess: () => {
      // Invalidate cả user và admin notifications vì xóa tất cả ảnh hưởng đến cả 2
      invalidateQueries.allNotifications(queryClient, session?.user?.id)
    },
    onError: (error: unknown) => {
      console.error("Error deleting all notifications:", error)
    },
  })
}

export function useNotificationsSocketBridge() {
  const queryClient = useQueryClient()
  const { data: session } = useSession()
  // Lấy role từ session.roles (không phải session.user.roles)
  const primaryRole = session?.roles?.[0]?.name ?? null

  const { socket, onNotification, onNotificationUpdated, onNotificationsSync } = useSocket({
    userId: session?.user?.id,
    role: primaryRole,
  })

  useEffect(() => {
    const userId = session?.user?.id
    if (!userId) return

    const invalidate = () => {
      // Chỉ invalidate user notifications khi có socket update
      invalidateQueries.userNotifications(queryClient, userId)
    }

    const stopNew = onNotification(() => {
      invalidate()
    })

    const stopUpdated = onNotificationUpdated(() => {
      invalidate()
    })

    const stopSync = onNotificationsSync(() => {
      invalidate()
    })

    return () => {
      stopNew?.()
      stopUpdated?.()
      stopSync?.()
    }
  }, [session?.user?.id, onNotification, onNotificationUpdated, onNotificationsSync, queryClient])

  return { socket }
}
