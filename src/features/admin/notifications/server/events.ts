import { prisma } from "@/services/prisma"
import { getSocketServer, storeNotificationInCache, mapNotificationToPayload } from "@/services/socket/state"
import { logger } from "@/utils"
import { resourceLogger } from "@/utils"
import type { Notification } from "@prisma/client"

export const emitNotificationNew = async (notification: Notification): Promise<void> => {
  const io = getSocketServer()
  if (!io) return

  try {
    // Fetch notification with user to get email/name
    const fullNotification = await prisma.notification.findUnique({
      where: { id: notification.id },
      include: { user: true },
    })

    if (!fullNotification) return

    const socketNotification = mapNotificationToPayload(fullNotification)
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
    // Fetch full notifications with user info
    const fullNotifications = await prisma.notification.findMany({
      where: { id: { in: notifications.map((n) => n.id) } },
      include: { user: true },
    })

    const notificationsByUser = new Map<string, (Notification & { user: { email: string; name: string | null } })[]>()
    for (const notification of fullNotifications) {
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
    if (fullNotifications.length > 0) {
      const roleNotification = mapNotificationToPayload(fullNotifications[0])
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
    // Fetch full notifications with user info
    const fullNotifications = await prisma.notification.findMany({
      where: { id: { in: notifications.map((n) => n.id) } },
      include: { user: true },
    })

    const notificationsByUser = new Map<string, (Notification & { user: { email: string; name: string | null } })[]>()
    for (const notification of fullNotifications) {
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
    if (fullNotifications.length > 0) {
      const roleNotification = mapNotificationToPayload(fullNotifications[0])
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

export const emitNotificationUpdated = async (notification: Notification): Promise<void> => {
  const io = getSocketServer()
  if (!io) return

  try {
    // Fetch notification with user to get email/name
    const fullNotification = await prisma.notification.findUnique({
      where: { id: notification.id },
      include: { user: true },
    })

    if (!fullNotification) return

    const payload = mapNotificationToPayload(fullNotification)
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
      include: { user: true },
      take: 50,
    })

    const payloads = updatedNotifications.map((n) => mapNotificationToPayload(n))

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

