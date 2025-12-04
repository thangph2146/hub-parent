/**
 * API Route: GET /api/admin/unread-counts
 * Get total unread messages, notifications, and contact requests count for current user
 */

import { NextRequest } from "next/server"
import { prisma } from "@/lib/database"
import { createGetRoute } from "@/lib/api/api-route-wrapper"
import { createErrorResponse, createSuccessResponse } from "@/lib/config"
import { isSuperAdmin } from "@/lib/permissions"
import { getTotalUnreadMessagesCountCached } from "@/features/admin/chat/server/unread-counts"
import type { ApiRouteContext } from "@/lib/api/types"
import { countUnreadNotificationsWithBreakdown } from "@/lib/notifications/count-helpers"

async function getUnreadCountsHandler(_req: NextRequest, context: ApiRouteContext) {
  const userId = context.session.user?.id
  const userEmail = context.session.user?.email

  if (!userId) {
    return createErrorResponse("Unauthorized", { status: 401 })
  }

  const roles = context.roles ?? []
  const isSuperAdminUser = isSuperAdmin(roles)
  
  // QUAN TRỌNG: Tất cả users (kể cả superadmin@hub.edu.vn) chỉ đếm notifications của chính họ
  // Logic này nhất quán với "mark all as read" - chỉ mark notifications của user này
  const PROTECTED_SUPER_ADMIN_EMAIL = "superadmin@hub.edu.vn"
  const isProtectedSuperAdmin = userEmail === PROTECTED_SUPER_ADMIN_EMAIL

  // Get contact requests count (chỉ active, không deleted, và chưa đọc)
  // Lưu ý: contactRequests trong unreadCounts đại diện cho số liên hệ chưa đọc
  const contactRequestsWhere = {
    deletedAt: null,
    isRead: false,
  }

  // Log để debug
  const logger = (await import("@/lib/config/logger")).logger
  
  // Sử dụng shared helper function để đảm bảo logic nhất quán với /api/notifications
  const countParams = {
    userId,
    userEmail,
    isProtectedSuperAdmin,
  }

  const [countResult, unreadMessagesCount, contactRequestsCount] = await Promise.all([
    countUnreadNotificationsWithBreakdown(countParams),
    getTotalUnreadMessagesCountCached(userId),
    prisma.contactRequest.count({ where: contactRequestsWhere }),
  ])

  logger.debug("GET /api/admin/unread-counts: Returning counts with detailed breakdown", {
    userId,
    userEmail,
    isSuperAdmin: isSuperAdminUser,
    isProtectedSuperAdmin,
    unreadNotificationsCount: countResult.unreadCount,
    unreadMessagesCount,
    contactRequestsCount,
    // Detailed breakdown từ shared helper
    systemUnreadCount: countResult.systemUnreadCount,
    personalUnreadCount: countResult.personalUnreadCount,
    allSystemUnreadCount: countResult.allSystemUnreadCount,
    expectedCount: countResult.expectedCount,
    countMatch: countResult.countMatchStatus,
    note: "Tất cả users (kể cả superadmin@hub.edu.vn): chỉ đếm notifications của chính user này",
  })

  return createSuccessResponse({
    unreadMessages: unreadMessagesCount,
    unreadNotifications: countResult.unreadCount,
    contactRequests: contactRequestsCount,
  })
}

export const GET = createGetRoute(getUnreadCountsHandler)

