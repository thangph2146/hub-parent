/**
 * Shared helper functions for counting notifications
 * Đảm bảo logic đếm nhất quán giữa các API endpoints
 */

import { prisma } from "@/services/prisma"
import { NotificationKind, type Prisma } from "@prisma/client"
import { PERMISSIONS, type Permission } from "@/constants/permissions"

export interface NotificationCountParams {
  userId: string
  userEmail: string | null | undefined
  isProtectedSuperAdmin: boolean
  permissions?: Permission[]
}

/**
 * Build where clause cho notifications query
 * CRITICAL: Logic này phải được sử dụng ở TẤT CẢ các API endpoints để đảm bảo consistency
 * 
 * QUAN TRỌNG: 
 * - Nếu có NOTIFICATIONS_VIEW_ALL hoặc là protected super admin: xem tất cả
 * - Nếu có NOTIFICATIONS_VIEW_OWN hoặc chỉ có NOTIFICATIONS_VIEW: chỉ xem của mình
 */
export const buildNotificationWhereClause = (params: NotificationCountParams): Prisma.NotificationWhereInput => {
  const { userId, isProtectedSuperAdmin, permissions = [] } = params
  
  // Nếu là protected super admin hoặc có quyền view_all, không filter theo userId
  if (isProtectedSuperAdmin || permissions.includes(PERMISSIONS.NOTIFICATIONS_VIEW_ALL)) {
    return {}
  }

  // Mặc định hoặc nếu có quyền view_own, filter theo userId
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
 * 
 * QUAN TRỌNG: Theo yêu cầu người dùng, unreadCount trả về LUÔN LUÔN chỉ là của owner
 * ngay cả khi user có quyền VIEW_ALL (để hiển thị đúng số lượng trên chuông thông báo)
 */
export const countUnreadNotificationsWithBreakdown = async (params: NotificationCountParams) => {
  const { userId, isProtectedSuperAdmin, permissions = [] } = params

  // unreadWhere cho count breakdown (có thể bao gồm all nếu có permission)
  const unreadWhere = buildUnreadNotificationWhereClause(params)
  // ownUnreadWhere cho count chính của user (luôn luôn chỉ là của owner)
  const ownUnreadWhere = buildOwnUnreadNotificationWhereClause(params)
  
  const isViewAll = isProtectedSuperAdmin || permissions.includes(PERMISSIONS.NOTIFICATIONS_VIEW_ALL)

  const [unreadCount, systemUnreadCount, personalUnreadCount, allSystemUnreadCount, ownUnreadCount] = await Promise.all([
    // Total unread count với where clause chính (đã handle view_all)
    prisma.notification.count({ where: unreadWhere }),
    // Đếm SYSTEM notifications (của user này hoặc tất cả nếu view_all)
    prisma.notification.count({
      where: {
        ...(isViewAll ? {} : { userId }),
        kind: NotificationKind.SYSTEM,
        isRead: false,
      },
    }),
    // Đếm personal notifications (của user này hoặc tất cả nếu view_all)
    prisma.notification.count({
      where: {
        ...(isViewAll ? {} : { userId }),
        kind: { not: NotificationKind.SYSTEM },
        isRead: false,
      },
    }),
    // Đếm TẤT CẢ SYSTEM notifications (của tất cả users)
    prisma.notification.count({
      where: {
        kind: NotificationKind.SYSTEM,
        isRead: false,
      },
    }),
    // Đếm notifications của CHÍNH user này (owner only)
    prisma.notification.count({ where: ownUnreadWhere }),
  ])

  // Nếu view_all: expectedCount là tổng cộng của tất cả (dùng cho debug)
  // Nếu không: chỉ đếm của user này
  const expectedCount = systemUnreadCount + personalUnreadCount

  return {
    unreadCount: ownUnreadCount, // QUAN TRỌNG: Trả về ownUnreadCount làm unreadCount chính
    allUnreadCount: unreadCount, // Giữ lại all count để debug nếu cần
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
