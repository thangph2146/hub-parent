import { prisma } from "@/services/prisma"
import { getSocketServer, storeNotificationInCache, mapNotificationToPayload } from "@/services/socket/state"
import { logger } from "@/utils"
import { resourceLogger } from "@/utils"
import type { Notification } from "@prisma/client"

export const emitNotificationNew = async (notification: Notification): Promise<void> => {
  const io = getSocketServer()
  if (!io) return

  try {
    const socketNotification = mapNotificationToPayload(notification)
    storeNotificationInCache(notification.userId, socketNotification)
    io.to(`user:${notification.userId}`).emit("notification:new", socketNotification)
    resourceLogger.socket({
      resource: "notifications",
      action: "create",
      event: "notification:new",
      resourceId: notification.id,
      payload: { notificationId: notification.id, userId: notification.userId },
    })
  } catch (error) {
    logger.error("Failed to emit socket notification", error instanceof Error ? error : new Error(String(error)))
  }
}

export const emitNotificationNewForSuperAdmins = async (
  notifications: Notification[],
): Promise<void> => {
  const io = getSocketServer()
  if (!io || notifications.length === 0) return

  try {
    const notificationsByUser = new Map<string, Notification[]>()
    for (const notification of notifications) {
      const existing = notificationsByUser.get(notification.userId) || []
      existing.push(notification)
      notificationsByUser.set(notification.userId, existing)
    }

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

    resourceLogger.logFlow({
      resource: "notifications",
      action: "socket-update",
      step: "success",
      details: { count: notifications.length, target: "super_admins", type: "batch" },
    })
  } catch (error) {
    logger.error("Failed to emit socket notifications for super admins", error instanceof Error ? error : new Error(String(error)))
  }
}

export const emitNotificationNewForAllAdmins = async (
  notifications: Notification[],
): Promise<void> => {
  const io = getSocketServer()
  if (!io || notifications.length === 0) return

  try {
    const notificationsByUser = new Map<string, Notification[]>()
    for (const notification of notifications) {
      const existing = notificationsByUser.get(notification.userId) || []
      existing.push(notification)
      notificationsByUser.set(notification.userId, existing)
    }

    for (const [userId, userNotifications] of notificationsByUser.entries()) {
      for (const notification of userNotifications) {
        const socketNotification = mapNotificationToPayload(notification)
        storeNotificationInCache(userId, socketNotification)
        io.to(`user:${userId}`).emit("notification:new", socketNotification)
      }
    }

    // Also emit to role rooms for broadcast (use first notification if available)
    if (notifications.length > 0) {
      const roleNotification = mapNotificationToPayload(notifications[0])
      io.to("role:super_admin").emit("notification:new", roleNotification)
      io.to("role:admin").emit("notification:new", roleNotification)
    }

    resourceLogger.logFlow({
      resource: "notifications",
      action: "socket-update",
      step: "success",
      details: { count: notifications.length, target: "all_admins", type: "batch" },
    })
  } catch (error) {
    logger.error("Failed to emit socket notifications for all admins", error instanceof Error ? error : new Error(String(error)))
  }
}

export const emitNotificationUpdated = (notification: Notification): void => {
  const io = getSocketServer()
  if (!io) return

  try {
    const payload = mapNotificationToPayload(notification)
    io.to(`user:${notification.userId}`).emit("notification:updated", payload)
    resourceLogger.socket({
      resource: "notifications",
      action: "update",
      event: "notification:updated",
      resourceId: notification.id,
      payload: { notificationId: notification.id, userId: notification.userId },
    })
  } catch (error) {
    logger.error("Failed to emit socket notification update", error instanceof Error ? error : new Error(String(error)))
  }
}

export const emitNotificationDeleted = (notificationId: string, userId: string): void => {
  const io = getSocketServer()
  if (!io) return

  try {
    io.to(`user:${userId}`).emit("notification:deleted", { id: notificationId })
    resourceLogger.socket({
      resource: "notifications",
      action: "delete",
      event: "notification:deleted",
      resourceId: notificationId,
      payload: { notificationId, userId },
    })
  } catch (error) {
    logger.error("Failed to emit socket notification deletion", error instanceof Error ? error : new Error(String(error)))
  }
}

export const emitNotificationsSync = async (
  notificationIds: string[],
  userId: string,
): Promise<void> => {
  const io = getSocketServer()
  if (!io || notificationIds.length === 0) return

  try {
    const updatedNotifications = await prisma.notification.findMany({
      where: { id: { in: notificationIds }, userId },
      take: 50,
    })

    const payloads = updatedNotifications.map(mapNotificationToPayload)

    payloads.forEach((payload) => {
      storeNotificationInCache(userId, payload)
    })

    io.to(`user:${userId}`).emit("notifications:sync", payloads)
    resourceLogger.logFlow({
      resource: "notifications",
      action: "socket-update",
      step: "success",
      details: { userId, count: payloads.length, type: "sync" },
    })
  } catch (error) {
    logger.error("Failed to emit socket notifications sync", error instanceof Error ? error : new Error(String(error)))
  }
}

export const emitNotificationsDeleted = (notificationIds: string[], userId: string): void => {
  const io = getSocketServer()
  if (!io || notificationIds.length === 0) return

  try {
    io.to(`user:${userId}`).emit("notifications:deleted", { ids: notificationIds })
    resourceLogger.logFlow({
      resource: "notifications",
      action: "bulk-delete",
      step: "success",
      details: { userId, count: notificationIds.length },
    })
  } catch (error) {
    logger.error("Failed to emit socket notifications deletion", error instanceof Error ? error : new Error(String(error)))
  }
}

