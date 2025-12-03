/**
 * API Route: POST /api/notifications/mark-all-read - Mark all notifications as read
 */
import { NextRequest } from "next/server"
import { auth } from "@/lib/auth/auth"
import { prisma } from "@/lib/database"
import { getSocketServer, getNotificationCache, mapNotificationToPayload } from "@/lib/socket/state"
import { createErrorResponse, createSuccessResponse } from "@/lib/config"
import { logger } from "@/lib/config/logger"
import { isSuperAdmin } from "@/lib/permissions"
import { NotificationKind } from "@prisma/client"

async function markAllAsReadHandler(_req: NextRequest) {
  const session = await auth()

  if (!session?.user?.id) {
    return createErrorResponse("Unauthorized", { status: 401 })
  }

  // Check if user is super admin
  const roles = (session as typeof session & { roles?: Array<{ name: string }> })?.roles || []
  const isSuperAdminUser = isSuperAdmin(roles)
  const userEmail = session.user.email
  
  // QUAN TRỌNG: Chỉ superadmin@hub.edu.vn mới có thể mark tất cả notifications
  // Các user khác (kể cả super admin khác) chỉ có thể mark notifications của chính họ
  const PROTECTED_SUPER_ADMIN_EMAIL = "superadmin@hub.edu.vn"
  const isProtectedSuperAdmin = userEmail === PROTECTED_SUPER_ADMIN_EMAIL

  logger.info("POST /api/notifications/mark-all-read: Processing request", {
    userId: session.user.id,
    userEmail,
    isSuperAdmin: isSuperAdminUser,
    isProtectedSuperAdmin,
  })

  // Build where clause
  // IMPORTANT: Logic mới:
  // - Chỉ superadmin@hub.edu.vn: có thể mark tất cả SYSTEM notifications + personal notifications
  // - Các user khác (kể cả super admin khác): chỉ mark notifications của chính mình
  let where: {
    isRead: boolean
    userId?: string
    OR?: Array<{ kind: NotificationKind } | { userId: string; kind: { not: NotificationKind } }>
    kind?: { not: NotificationKind }
  }

  if (isProtectedSuperAdmin) {
    // Chỉ superadmin@hub.edu.vn: mark tất cả SYSTEM notifications + personal notifications
    where = {
      isRead: false,
      OR: [
        { kind: NotificationKind.SYSTEM },
        { userId: session.user.id, kind: { not: NotificationKind.SYSTEM } },
      ],
    }
  } else {
    // Các user khác: chỉ mark notifications của chính mình
    where = {
      isRead: false,
      userId: session.user.id,
    }
  }

  logger.debug("POST /api/notifications/mark-all-read: Where clause", {
    userId: session.user.id,
    userEmail,
    isSuperAdmin: isSuperAdminUser,
    isProtectedSuperAdmin,
    where,
    note: isProtectedSuperAdmin 
      ? "superadmin@hub.edu.vn: có thể mark tất cả notifications" 
      : "Chỉ mark notifications của chính mình",
  })

  // Check how many notifications match before update (for logging)
  const beforeCount = await prisma.notification.count({ where })
  
  logger.debug("POST /api/notifications/mark-all-read: Before update", {
    userId: session.user.id,
    isSuperAdmin: isSuperAdminUser,
    matchingCount: beforeCount,
  })

  // Update all unread notifications matching the where clause
  // Không filter theo expiresAt - giữ nguyên thông báo cho đến khi user tự xóa
  const result = await prisma.notification.updateMany({
    where,
    data: {
      isRead: true,
      readAt: new Date(),
    },
  })
  
  logger.success("POST /api/notifications/mark-all-read: Marked all as read", {
    userId: session.user.id,
    userEmail,
    isSuperAdmin: isSuperAdminUser,
    isProtectedSuperAdmin,
    matchingCount: beforeCount,
    updatedCount: result.count,
    note: isProtectedSuperAdmin 
      ? "superadmin@hub.edu.vn: đã mark tất cả notifications" 
      : "Chỉ mark notifications của chính mình",
  })

  // Emit socket event để đồng bộ real-time
  const io = getSocketServer()
  if (io && result.count > 0) {
    try {
      // Reload notifications từ DB với cùng where clause như khi fetch
      // Chỉ superadmin@hub.edu.vn: tất cả SYSTEM notifications + personal notifications
      // Các user khác: chỉ personal notifications
      const fetchWhere: {
        OR?: Array<{ kind: NotificationKind } | { userId: string; kind: { not: NotificationKind } }>
        userId?: string
        kind?: { not: NotificationKind }
      } = isProtectedSuperAdmin
        ? {
            OR: [
              { kind: NotificationKind.SYSTEM },
              { userId: session.user.id, kind: { not: NotificationKind.SYSTEM } },
            ],
          }
        : {
            userId: session.user.id,
            kind: { not: NotificationKind.SYSTEM },
          }

      const notifications = await prisma.notification.findMany({
        where: fetchWhere,
        orderBy: { createdAt: "desc" },
        take: 50,
      })

      const cache = getNotificationCache()
      const payloads = notifications.map(mapNotificationToPayload)
      cache.set(session.user.id, payloads)

      logger.debug("POST /api/notifications/mark-all-read: Emitting sync event", {
        userId: session.user.id,
        notificationsCount: payloads.length,
      })

      // Emit sync event để client reload notifications
      io.to(`user:${session.user.id}`).emit("notifications:sync", payloads)
    } catch (error) {
      logger.error("POST /api/notifications/mark-all-read: Failed to emit socket event", error)
    }
  }

  return createSuccessResponse({ count: result.count })
}

export async function POST(req: NextRequest) {
  try {
    return await markAllAsReadHandler(req)
  } catch (error) {
    console.error("Error marking all notifications as read:", error)
    return createErrorResponse("Internal server error", { status: 500 })
  }
}
