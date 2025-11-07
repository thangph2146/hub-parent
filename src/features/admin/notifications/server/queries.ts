/**
 * Non-cached Database Queries for Notifications
 * 
 * Chứa các database queries không có cache wrapper
 * Sử dụng cho các trường hợp cần fresh data hoặc trong API routes
 */
import { validatePagination, buildPagination, type ResourcePagination } from "@/features/admin/resources/server"
import type { Prisma } from "@prisma/client"
import { NotificationKind } from "@prisma/client"
import { prisma } from "@/lib/database"

export interface ListNotificationsInput {
  page?: number
  limit?: number
  search?: string
  filters?: Record<string, string>
  userId?: string
  kind?: string
  isRead?: boolean
}

export interface ListedNotification {
  id: string
  userId: string
  user: {
    id: string
    email: string
    name: string | null
  }
  kind: string
  title: string
  description: string | null
  isRead: boolean
  actionUrl: string | null
  metadata: Prisma.JsonValue | null
  expiresAt: Date | null
  createdAt: Date
  readAt: Date | null
}

export interface ListNotificationsResult {
  data: ListedNotification[]
  pagination: ResourcePagination
}

function isValidKind(value: string): value is NotificationKind {
  return Object.values(NotificationKind).includes(value as NotificationKind)
}

function buildWhereClause(params: ListNotificationsInput): Prisma.NotificationWhereInput {
  const where: Prisma.NotificationWhereInput = {}

  if (params.userId) where.userId = params.userId
  if (params.isRead !== undefined) where.isRead = params.isRead

  if (params.kind && isValidKind(params.kind)) {
    where.kind = params.kind
  }

  if (params.search) {
    const searchValue = params.search.trim()
    if (searchValue.length > 0) {
      where.OR = [
        { title: { contains: searchValue, mode: "insensitive" } },
        { description: { contains: searchValue, mode: "insensitive" } },
        { user: { email: { contains: searchValue, mode: "insensitive" } } },
        { user: { name: { contains: searchValue, mode: "insensitive" } } },
      ]
    }
  }

  if (params.filters) {
    for (const [key, rawValue] of Object.entries(params.filters)) {
      const value = rawValue?.trim()
      if (!value) continue

      switch (key) {
        case "userId":
          where.userId = value
          break
        case "kind":
          if (isValidKind(value)) where.kind = value
          break
        case "isRead":
          where.isRead = value === "true"
          break
      }
    }
  }

  return where
}

/**
 * Non-cached query: List notifications
 * 
 * Sử dụng cho API routes hoặc khi cần fresh data
 */
export async function listNotifications(params: ListNotificationsInput = {}): Promise<ListNotificationsResult> {
  const { page, limit } = validatePagination(params.page, params.limit, 100)
  const where = buildWhereClause(params)

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: (page - 1) * limit,
    }),
    prisma.notification.count({ where }),
  ])

  return {
    data: notifications.map((n) => ({
      id: n.id,
      userId: n.userId,
      user: n.user,
      kind: n.kind,
      title: n.title,
      description: n.description,
      isRead: n.isRead,
      actionUrl: n.actionUrl,
      metadata: n.metadata,
      expiresAt: n.expiresAt,
      createdAt: n.createdAt,
      readAt: n.readAt,
    })),
    pagination: buildPagination(page, limit, total),
  }
}

/**
 * Non-cached query: Get notification by ID
 */
export async function getNotificationById(id: string): Promise<ListedNotification | null> {
  const notification = await prisma.notification.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
  })

  if (!notification) return null

  return {
    id: notification.id,
    userId: notification.userId,
    user: notification.user,
    kind: notification.kind,
    title: notification.title,
    description: notification.description,
    isRead: notification.isRead,
    actionUrl: notification.actionUrl,
    metadata: notification.metadata,
    expiresAt: notification.expiresAt,
    createdAt: notification.createdAt,
    readAt: notification.readAt,
  } as ListedNotification
}

/**
 * Get unique values for a specific column (for filter options)
 * For notifications, we only support userEmail (from user relation)
 */
export async function getNotificationColumnOptions(
  column: string,
  search?: string,
  limit: number = 50
): Promise<Array<{ label: string; value: string }>> {
  if (column !== "userEmail") {
    return []
  }

  const where: Prisma.UserWhereInput = {
    deletedAt: null, // Only active users
  }

  // Add search filter if provided
  if (search && search.trim()) {
    where.email = { contains: search.trim(), mode: "insensitive" }
  }

  // Get users that have notifications
  const usersWithNotifications = await prisma.user.findMany({
    where: {
      ...where,
      notifications: {
        some: {},
      },
    },
    select: {
      email: true,
    },
    distinct: ["email"],
    orderBy: { email: "asc" },
    take: limit,
  })

  // Map results to options format
  return usersWithNotifications
    .map((user) => {
      if (user.email && user.email.trim()) {
        return {
          label: user.email,
          value: user.email,
        }
      }
      return null
    })
    .filter((item): item is { label: string; value: string } => item !== null)
}

