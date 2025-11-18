/**
 * Socket events emission cho notifications
 * Tách logic emit socket events ra khỏi mutations để code sạch hơn
 */

import { prisma } from "@/lib/database"
import { getSocketServer, storeNotificationInCache, mapNotificationToPayload } from "@/lib/socket/state"
import { logger } from "@/lib/config"
import type { Notification } from "@prisma/client"

/**
 * Emit notification:new event
 * Được gọi khi notification mới được tạo
 */
export async function emitNotificationNew(notification: Notification): Promise<void> {
  const io = getSocketServer()
  if (!io) return

  try {
    const socketNotification = mapNotificationToPayload(notification)
    storeNotificationInCache(notification.userId, socketNotification)
    io.to(`user:${notification.userId}`).emit("notification:new", socketNotification)
    logger.debug("Socket notification emitted for user", {
      notificationId: notification.id,
      userId: notification.userId,
    })
  } catch (error) {
    logger.error("Failed to emit socket notification", error instanceof Error ? error : new Error(String(error)))
  }
}

/**
 * Emit notification:new event cho tất cả super admins
 * Được gọi khi tạo notification cho super admins
 */
export async function emitNotificationNewForSuperAdmins(
  notifications: Notification[],
): Promise<void> {
  const io = getSocketServer()
  if (!io || notifications.length === 0) return

  try {
    // Group notifications by userId
    const notificationsByUser = new Map<string, Notification[]>()
    for (const notification of notifications) {
      const existing = notificationsByUser.get(notification.userId) || []
      existing.push(notification)
      notificationsByUser.set(notification.userId, existing)
    }

    // Emit to each user
    for (const [userId, userNotifications] of notificationsByUser.entries()) {
      for (const notification of userNotifications) {
        const socketNotification = mapNotificationToPayload(notification)
        storeNotificationInCache(userId, socketNotification)
        io.to(`user:${userId}`).emit("notification:new", socketNotification)
      }
    }

    // Also emit to role room for broadcast (use first notification if available)
    if (notifications.length > 0) {
      const roleNotification = mapNotificationToPayload(notifications[0])
      io.to("role:super_admin").emit("notification:new", roleNotification)
    }

    logger.debug("Socket notifications emitted for super admins", {
      count: notifications.length,
    })
  } catch (error) {
    logger.error("Failed to emit socket notifications for super admins", error instanceof Error ? error : new Error(String(error)))
  }
}

/**
 * Emit notification:updated event
 * Được gọi khi notification được cập nhật (mark as read/unread)
 */
export function emitNotificationUpdated(notification: Notification): void {
  const io = getSocketServer()
  if (!io) return

  try {
    const payload = mapNotificationToPayload(notification)
    io.to(`user:${notification.userId}`).emit("notification:updated", payload)
    logger.debug("Socket notification update emitted", {
      notificationId: notification.id,
      userId: notification.userId,
    })
  } catch (error) {
    logger.error("Failed to emit socket notification update", error instanceof Error ? error : new Error(String(error)))
  }
}

/**
 * Emit notification:deleted event
 * Được gọi khi notification bị xóa
 */
export function emitNotificationDeleted(notificationId: string, userId: string): void {
  const io = getSocketServer()
  if (!io) return

  try {
    io.to(`user:${userId}`).emit("notification:deleted", { id: notificationId })
    logger.debug("Socket notification deletion emitted", { notificationId, userId })
  } catch (error) {
    logger.error("Failed to emit socket notification deletion", error instanceof Error ? error : new Error(String(error)))
  }
}

/**
 * Emit notifications:sync event
 * Được gọi khi bulk mark as read/unread để sync nhiều notifications
 */
export async function emitNotificationsSync(
  notificationIds: string[],
  userId: string,
): Promise<void> {
  const io = getSocketServer()
  if (!io || notificationIds.length === 0) return

  try {
    // Reload updated notifications và emit
    const updatedNotifications = await prisma.notification.findMany({
      where: { id: { in: notificationIds }, userId },
      take: 50,
    })

    const payloads = updatedNotifications.map(mapNotificationToPayload)

    // Update cache
    payloads.forEach((payload) => {
      storeNotificationInCache(userId, payload)
    })

    io.to(`user:${userId}`).emit("notifications:sync", payloads)
    logger.debug("Socket notifications sync emitted", { userId, count: payloads.length })
  } catch (error) {
    logger.error("Failed to emit socket notifications sync", error instanceof Error ? error : new Error(String(error)))
  }
}

/**
 * Emit notifications:deleted event
 * Được gọi khi bulk delete notifications
 */
export function emitNotificationsDeleted(notificationIds: string[], userId: string): void {
  const io = getSocketServer()
  if (!io || notificationIds.length === 0) return

  try {
    io.to(`user:${userId}`).emit("notifications:deleted", { ids: notificationIds })
    logger.debug("Socket notifications deletion emitted", { userId, count: notificationIds.length })
  } catch (error) {
    logger.error("Failed to emit socket notifications deletion", error instanceof Error ? error : new Error(String(error)))
  }
}

