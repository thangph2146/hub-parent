/**
 * API Route: POST /api/notifications/mark-all-read - Mark all notifications as read
 */
import { NextRequest } from "next/server"
import { auth } from "@/auth/server"
import { prisma } from "@/services/prisma"
import { getSocketServer, getNotificationCache, mapNotificationToPayload } from "@/services/socket/state"
import { createErrorResponse, createSuccessResponse } from "@/lib"
import { logger } from "@/utils"
import { isSuperAdmin } from "@/permissions"
import { buildOwnUnreadNotificationWhereClause, buildNotificationWhereClause, countUnreadNotificationsWithBreakdown } from "@/lib"

import { type Permission } from "@/constants/permissions"

async function markAllAsReadHandler(_req: NextRequest) {
  const session = await auth()

  if (!session?.user?.id) {
    return createErrorResponse("Unauthorized", { status: 401 })
  }

  // Check if user is super admin
  const roles = session.roles || []
  const permissions = (session.permissions || []) as Permission[]
  const isSuperAdminUser = isSuperAdmin(roles)
  const userEmail = session.user.email
  
  // QUAN TRỌNG: Chỉ superadmin@hub.edu.vn mới có thể mark tất cả notifications
  // Các user khác (kể cả super admin khác) chỉ có thể mark notifications của chính họ
  // TRỪ KHI họ có quyền NOTIFICATIONS_VIEW_ALL
  const PROTECTED_SUPER_ADMIN_EMAIL = "superadmin@hub.edu.vn"
  const isProtectedSuperAdmin = userEmail === PROTECTED_SUPER_ADMIN_EMAIL

  logger.info("POST /api/notifications/mark-all-read: Processing request", {
    userId: session.user.id,
    userEmail,
    isSuperAdmin: isSuperAdminUser,
    isProtectedSuperAdmin,
    permissionsCount: permissions.length,
  })

  // Sử dụng shared helper function để đảm bảo logic nhất quán với /api/notifications và /api/admin/unread-counts
  const countParams = {
    userId: session.user.id,
    userEmail,
    isProtectedSuperAdmin,
    permissions,
  }

  // Build where clause - Mark notifications dựa trên quyền hạn
  // THEO YÊU CẦU NGƯỜI DÙNG: Luôn chỉ mark notifications của CHÍNH user này (owner only)
  // để tránh việc mark nhầm tất cả notifications trong hệ thống khi dùng ở chuông thông báo
  const where = buildOwnUnreadNotificationWhereClause(countParams)
  
  // Đếm số lượng notifications sẽ được mark
  const unreadCountToMark = await prisma.notification.count({ where })
  
  // Đếm chi tiết để debug và verify (sử dụng countUnreadNotificationsWithBreakdown để so sánh)
  const countResult = await countUnreadNotificationsWithBreakdown(countParams)

  logger.debug("POST /api/notifications/mark-all-read: Where clause and count breakdown", {
    userId: session.user.id,
    userEmail,
    isSuperAdmin: isSuperAdminUser,
    isProtectedSuperAdmin,
    where,
    unreadCountToMark,
    // Detailed breakdown từ shared helper (để so sánh)
    totalUnreadCount: countResult.allUnreadCount,
    ownUnreadCount: countResult.unreadCount,
    systemUnreadCount: countResult.systemUnreadCount,
    personalUnreadCount: countResult.personalUnreadCount,
    allSystemUnreadCount: countResult.allSystemUnreadCount,
  })

  // Update all unread notifications matching the where clause
  const result = await prisma.notification.updateMany({
    where,
    data: {
      isRead: true,
      readAt: new Date(),
    },
  })
  
  // Verify count match
  const countMatch = result.count === unreadCountToMark
  if (!countMatch) {
    logger.warn("POST /api/notifications/mark-all-read: Count mismatch after update", {
      userId: session.user.id,
      userEmail,
      expectedCount: unreadCountToMark,
      actualCount: result.count,
    })
  }

  logger.success("POST /api/notifications/mark-all-read: Marked all as read", {
    userId: session.user.id,
    userEmail,
    isSuperAdmin: isSuperAdminUser,
    isProtectedSuperAdmin,
    updatedCount: result.count,
    countMatch,
    countBreakdown: {
      systemUnreadCount: countResult.systemUnreadCount,
      personalUnreadCount: countResult.personalUnreadCount,
      allSystemUnreadCount: countResult.allSystemUnreadCount,
      totalUnreadCount: countResult.allUnreadCount,
      ownUnreadCount: countResult.unreadCount,
    },
    note: "CHỈ mark notifications của user này (không mark tất cả SYSTEM notifications của tất cả users)",
  })

  // Emit socket event để đồng bộ real-time
  const io = getSocketServer()
  if (io && result.count > 0) {
    try {
      // Reload notifications từ DB với cùng where clause như khi fetch - Sử dụng shared helper
      const fetchWhere = buildNotificationWhereClause(countParams)

      const notifications = await prisma.notification.findMany({
        where: fetchWhere,
        include: { user: true },
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
    logger.error("POST /api/notifications/mark-all-read: Error marking all notifications as read", {
      error: error instanceof Error ? error : new Error(String(error)),
    })
    return createErrorResponse("Internal server error", { status: 500 })
  }
}
