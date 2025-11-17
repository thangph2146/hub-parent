"use client"

import * as React from "react"
import { useSession } from "next-auth/react"
import { useQueryClient } from "@tanstack/react-query"
import { NavMain } from "./nav-main"
import { useUnreadCounts } from "@/hooks/use-unread-counts"
import { useNotificationsSocketBridge } from "@/hooks/use-notifications"
import { useSocket } from "@/hooks/use-socket"
import { queryKeys } from "@/lib/query-keys"
import type { MenuItem } from "@/lib/config"

interface NavMainWithBadgesProps {
  items: MenuItem[]
}

/**
 * Client component wrapper để inject unread counts vào menu items
 * Tích hợp socket để cập nhật real-time
 */
export function NavMainWithBadges({ items }: NavMainWithBadgesProps) {
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  const userId = session?.user?.id
  const primaryRole = session?.roles?.[0]?.name ?? null

  // Get unread counts với polling fallback
  const { data: unreadCounts } = useUnreadCounts({
    refetchInterval: 30000, // 30 seconds (fallback khi không có socket)
    enabled: !!userId,
  })

  // Setup socket bridge cho notifications
  useNotificationsSocketBridge()

  // Setup socket cho messages để invalidate unread counts
  const { socket } = useSocket({
    userId,
    role: primaryRole,
  })

  // Invalidate unread counts khi có socket events
  React.useEffect(() => {
    if (!socket || !userId) return

    const handleMessageNew = () => {
      // Invalidate unread counts khi có message mới
      queryClient.invalidateQueries({
        queryKey: queryKeys.unreadCounts.user(userId),
      })
    }

    const handleMessageUpdated = () => {
      // Invalidate unread counts khi message được cập nhật (read/unread)
      queryClient.invalidateQueries({
        queryKey: queryKeys.unreadCounts.user(userId),
      })
    }

    const handleNotificationNew = () => {
      // Invalidate unread counts khi có notification mới
      queryClient.invalidateQueries({
        queryKey: queryKeys.unreadCounts.user(userId),
      })
    }

    const handleNotificationUpdated = () => {
      // Invalidate unread counts khi notification được cập nhật
      queryClient.invalidateQueries({
        queryKey: queryKeys.unreadCounts.user(userId),
      })
    }

    // Listen to socket events
    if (socket.connected) {
      socket.on("message:new", handleMessageNew)
      socket.on("message:updated", handleMessageUpdated)
      socket.on("notification:new", handleNotificationNew)
      socket.on("notification:updated", handleNotificationUpdated)
    } else {
      const onConnect = () => {
        socket.on("message:new", handleMessageNew)
        socket.on("message:updated", handleMessageUpdated)
        socket.on("notification:new", handleNotificationNew)
        socket.on("notification:updated", handleNotificationUpdated)
      }
      socket.once("connect", onConnect)
    }

    return () => {
      if (socket) {
        socket.off("message:new", handleMessageNew)
        socket.off("message:updated", handleMessageUpdated)
        socket.off("notification:new", handleNotificationNew)
        socket.off("notification:updated", handleNotificationUpdated)
      }
    }
  }, [socket, userId, queryClient])

  // Map unread counts to menu items
  const itemsWithBadges = React.useMemo(() => {
    return items.map((item) => {
      if (item.key === "messages") {
        return {
          ...item,
          badgeCount: unreadCounts?.unreadMessages || 0,
        }
      }
      if (item.key === "notifications") {
        return {
          ...item,
          badgeCount: unreadCounts?.unreadNotifications || 0,
        }
      }
      return item
    })
  }, [items, unreadCounts])

  return <NavMain items={itemsWithBadges} />
}

