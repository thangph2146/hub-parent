/**
 * Shared helper functions for counting notifications
 * Đảm bảo logic đếm nhất quán giữa các API endpoints
 */

import { prisma } from "@/lib/prisma"
import { NotificationKind, type Prisma } from "@prisma/client"

export interface NotificationCountParams {
  userId: string
  userEmail: string | null | undefined
  isProtectedSuperAdmin: boolean
}

/**
 * Build where clause cho notifications query
 * CRITICAL: Logic này phải được sử dụng ở TẤT CẢ các API endpoints để đảm bảo consistency
 * 
 * QUAN TRỌNG: Với superadmin@hub.edu.vn, chỉ đếm SYSTEM notifications của chính user này
 * (không đếm SYSTEM notifications của user khác) để nhất quán với logic "mark all as read"
 */
export const buildNotificationWhereClause = (params: NotificationCountParams): Prisma.NotificationWhereInput => {
  const { userId } = params
  return {
    userId,
  }
}

/**
 * Build where clause cho unread notifications count
 * CRITICAL: Logic này phải được sử dụng ở TẤT CẢ các API endpoints để đảm bảo consistency
 */
export const buildUnreadNotificationWhereClause = (params: NotificationCountParams): Prisma.NotificationWhereInput => ({
  ...buildNotificationWhereClause(params),
  isRead: false,
})

/**
 * Build where clause cho mark all as read - CHỈ mark notifications của user này
 * QUAN TRỌNG: Khác với buildUnreadNotificationWhereClause, function này LUÔN chỉ mark notifications của user này
 * (không mark tất cả SYSTEM notifications của tất cả users, ngay cả với superadmin@hub.edu.vn)
 */
export const buildOwnUnreadNotificationWhereClause = (params: NotificationCountParams): Prisma.NotificationWhereInput => {
  const { userId } = params
  return {
    userId,
    isRead: false,
  }
}

/**
 * Count unread notifications với detailed breakdown
 * Trả về cả total count và breakdown để debug
 */
export const countUnreadNotificationsWithBreakdown = async (params: NotificationCountParams) => {
  const { userId, isProtectedSuperAdmin } = params

  const unreadWhere = buildUnreadNotificationWhereClause(params)

  const [unreadCount, systemUnreadCount, personalUnreadCount, allSystemUnreadCount] = await Promise.all([
    // Total unread count với where clause chính
    prisma.notification.count({ where: unreadWhere }),
    // Đếm SYSTEM notifications của user này
    prisma.notification.count({
      where: {
        userId,
        kind: NotificationKind.SYSTEM,
        isRead: false,
      },
    }),
    // Đếm personal notifications của user này
    prisma.notification.count({
      where: {
        userId,
        kind: { not: NotificationKind.SYSTEM },
        isRead: false,
      },
    }),
    // Đếm TẤT CẢ SYSTEM notifications (của tất cả users) - chỉ khi là protected super admin
    isProtectedSuperAdmin
      ? prisma.notification.count({
          where: {
            kind: NotificationKind.SYSTEM,
            isRead: false,
          },
        })
      : Promise.resolve(0),
  ])

  // Tất cả users (kể cả superadmin@hub.edu.vn): chỉ đếm notifications của chính user này
  const expectedCount = systemUnreadCount + personalUnreadCount

  return {
    unreadCount,
    systemUnreadCount,
    personalUnreadCount,
    allSystemUnreadCount,
    expectedCount,
    countMatch: unreadCount === expectedCount,
    countMatchStatus: unreadCount === expectedCount
      ? "✅ Match"
      : `⚠️ Mismatch: expected ${expectedCount}, got ${unreadCount}`,
  }
}

