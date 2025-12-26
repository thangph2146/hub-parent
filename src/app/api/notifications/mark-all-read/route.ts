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
import { buildOwnUnreadNotificationWhereClause, buildNotificationWhereClause, countUnreadNotificationsWithBreakdown } from "@/lib/utils"

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

  // Sử dụng shared helper function để đảm bảo logic nhất quán với /api/notifications và /api/admin/unread-counts
  const countParams = {
    userId: session.user.id,
    userEmail,
    isProtectedSuperAdmin,
  }

  // Build where clause - CHỈ mark notifications của user này (không mark tất cả SYSTEM notifications)
  // QUAN TRỌNG: Sử dụng buildOwnUnreadNotificationWhereClause để đảm bảo chỉ mark notifications của user này
  const where = buildOwnUnreadNotificationWhereClause(countParams)
  
  // Đếm số lượng notifications của user này sẽ được mark
  const ownUnreadCount = await prisma.notification.count({ where })
  
  // Đếm chi tiết để debug và verify (sử dụng countUnreadNotificationsWithBreakdown để so sánh)
  const countResult = await countUnreadNotificationsWithBreakdown(countParams)

  logger.debug("POST /api/notifications/mark-all-read: Where clause and count breakdown", {
    userId: session.user.id,
    userEmail,
    isSuperAdmin: isSuperAdminUser,
    isProtectedSuperAdmin,
    where,
    ownUnreadCount, // Số lượng notifications của user này sẽ được mark
    // Detailed breakdown từ shared helper (để so sánh)
    totalUnreadCount: countResult.unreadCount, // Tổng số unread (có thể bao gồm SYSTEM của tất cả users nếu là protected super admin)
    systemUnreadCount: countResult.systemUnreadCount, // SYSTEM notifications của user này
    personalUnreadCount: countResult.personalUnreadCount, // Personal notifications của user này
    allSystemUnreadCount: countResult.allSystemUnreadCount, // Tất cả SYSTEM notifications (nếu là protected super admin)
    expectedOwnCount: countResult.systemUnreadCount + countResult.personalUnreadCount, // Số lượng notifications của user này
    note: "CHỈ mark notifications của user này (không mark tất cả SYSTEM notifications của tất cả users)",
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
  
  // Verify count match - so sánh với ownUnreadCount (số lượng notifications của user này)
  const expectedOwnCount = countResult.systemUnreadCount + countResult.personalUnreadCount
  const countMatch = result.count === ownUnreadCount && result.count === expectedOwnCount
  if (!countMatch) {
    logger.warn("POST /api/notifications/mark-all-read: Count mismatch after update", {
      userId: session.user.id,
      userEmail,
      expectedOwnCount,
      ownUnreadCount,
      actualCount: result.count,
      countBreakdown: {
        systemUnreadCount: countResult.systemUnreadCount,
        personalUnreadCount: countResult.personalUnreadCount,
        allSystemUnreadCount: countResult.allSystemUnreadCount,
        totalUnreadCount: countResult.unreadCount, // Tổng số unread (có thể bao gồm SYSTEM của tất cả users)
      },
      note: "Đã mark notifications của user này, không mark tất cả SYSTEM notifications của tất cả users",
    })
  }

  logger.success("POST /api/notifications/mark-all-read: Marked all as read", {
    userId: session.user.id,
    userEmail,
    isSuperAdmin: isSuperAdminUser,
    isProtectedSuperAdmin,
    expectedOwnCount,
    ownUnreadCount,
    updatedCount: result.count,
    countMatch,
    countBreakdown: {
      systemUnreadCount: countResult.systemUnreadCount,
      personalUnreadCount: countResult.personalUnreadCount,
      allSystemUnreadCount: countResult.allSystemUnreadCount,
      totalUnreadCount: countResult.unreadCount, // Tổng số unread (có thể bao gồm SYSTEM của tất cả users)
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
