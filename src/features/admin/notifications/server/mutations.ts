/**
 * Server mutations for notifications
 */
import { prisma } from "@/lib/database"
import { NotificationKind, Prisma } from "@prisma/client"
import { DEFAULT_ROLES } from "@/lib/permissions"

/**
 * Create notification for a specific user
 * Không cần check permission - dùng cho system notifications
 */
export async function createNotificationForUser(
  userId: string,
  title: string,
  description?: string | null,
  actionUrl?: string | null,
  kind: NotificationKind = NotificationKind.SYSTEM,
  metadata?: Record<string, unknown> | null
) {
  // Kiểm tra user có tồn tại và active
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, isActive: true, deletedAt: true },
  })

  if (!user || !user.isActive || user.deletedAt) {
    console.warn("[notifications] User not found or inactive:", userId)
    return null
  }

  // Tạo notification cho user (không cần check permission)
  const notification = await prisma.notification.create({
    data: {
      userId,
      title,
      description: description ?? null,
      actionUrl: actionUrl ?? null,
      kind,
      metadata: metadata ? (metadata as Prisma.InputJsonValue) : Prisma.JsonNull,
      isRead: false,
    },
  })

  console.log("[notifications] Created notification for user:", {
    notificationId: notification.id,
    userId,
    email: user.email,
    title,
  })

  return notification
}

/**
 * Create notification for all super admins
 * Used for system-wide notifications that only super admins should see
 */
export async function createNotificationForSuperAdmins(
  title: string,
  description?: string | null,
  actionUrl?: string | null,
  kind: NotificationKind = NotificationKind.SYSTEM,
  metadata?: Record<string, unknown> | null
) {
  // Find all super admin users
  const superAdmins = await prisma.user.findMany({
    where: {
      isActive: true,
      deletedAt: null,
      userRoles: {
        some: {
          role: {
            name: DEFAULT_ROLES.SUPER_ADMIN.name,
            isActive: true,
            deletedAt: null,
          },
        },
      },
    },
    select: { id: true, email: true },
  })

  console.log("[notifications] Found super admins:", {
    count: superAdmins.length,
    adminIds: superAdmins.map((a) => a.id),
    adminEmails: superAdmins.map((a) => a.email),
  })

  if (superAdmins.length === 0) {
    console.warn("[notifications] No super admin found to receive notification")
    return { count: 0 }
  }

  // Create notifications for all super admins
  const notifications = await prisma.notification.createMany({
    data: superAdmins.map((admin) => ({
      userId: admin.id,
      title,
      description: description ?? null,
      actionUrl: actionUrl ?? null,
      kind,
      metadata: metadata ? (metadata as Prisma.InputJsonValue) : Prisma.JsonNull,
      isRead: false,
    })),
  })

  console.log("[notifications] Created notifications:", {
    count: notifications.count,
    title,
    adminCount: superAdmins.length,
  })

  return { count: notifications.count }
}

export async function markNotificationAsRead(notificationId: string) {
  return await prisma.notification.update({
    where: { id: notificationId },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  })
}

export async function markNotificationAsUnread(notificationId: string) {
  return await prisma.notification.update({
    where: { id: notificationId },
    data: {
      isRead: false,
      readAt: null,
    },
  })
}

export async function deleteNotification(notificationId: string) {
  return await prisma.notification.delete({
    where: { id: notificationId },
  })
}

export async function bulkMarkAsRead(notificationIds: string[]) {
  const result = await prisma.notification.updateMany({
    where: { id: { in: notificationIds } },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  })
  return { count: result.count }
}

export async function bulkDelete(notificationIds: string[]) {
  const result = await prisma.notification.deleteMany({
    where: { id: { in: notificationIds } },
  })
  return { count: result.count }
}
