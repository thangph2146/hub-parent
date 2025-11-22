/**
 * Helper functions để emit notifications realtime cho tags actions
 * Tối ưu theo chuẩn Next.js 16 với logging và caching
 */

import { prisma } from "@/lib/database"
import { resourceLogger } from "@/lib/config"
import { getSocketServer, storeNotificationInCache, mapNotificationToPayload } from "@/lib/socket/state"
import { createNotificationForSuperAdmins } from "@/features/admin/notifications/server/mutations"
import { NotificationKind } from "@prisma/client"

/**
 * Helper function để lấy thông tin actor (người thực hiện action)
 */
async function getActorInfo(actorId: string) {
  const actor = await prisma.user.findUnique({
    where: { id: actorId },
    select: { id: true, email: true, name: true },
  })
  return actor
}

/**
 * Format tag names cho notification description
 * Hiển thị tối đa 5 tên đầu tiên, nếu nhiều hơn sẽ hiển thị "... và X thẻ tag khác"
 */
function formatTagNames(tags: Array<{ name: string }>, maxNames = 5): string {
  if (!tags || tags.length === 0) return ""
  
  const displayNames = tags.slice(0, maxNames).map(t => `"${t.name}"`)
  const remainingCount = tags.length > maxNames ? tags.length - maxNames : 0
  
  if (remainingCount > 0) {
    return `${displayNames.join(", ")} và ${remainingCount} thẻ tag khác`
  }
  return displayNames.join(", ")
}

/**
 * Helper function để tạo system notification cho super admin về tag actions
 */
export async function notifySuperAdminsOfTagAction(
  action: "create" | "update" | "delete" | "restore" | "hard-delete",
  actorId: string,
  tag: { id: string; name: string; slug: string },
  changes?: {
    name?: { old: string; new: string }
    slug?: { old: string; new: string }
  }
) {
  const startTime = Date.now()
  
  resourceLogger.actionFlow({
    resource: "tags",
    action: action,
    step: "start",
    metadata: { tagId: tag.id, tagName: tag.name, actorId },
  })

  try {
    const actor = await getActorInfo(actorId)
    const actorName = actor?.name || actor?.email || "Hệ thống"

    let title = ""
    let description = ""
    const actionUrl = `/admin/tags/${tag.id}`

    switch (action) {
      case "create":
        title = "🏷️ Thẻ tag mới"
        description = `${actorName} đã tạo "${tag.name}"`
        break
      case "update":
        const changeDescriptions: string[] = []
        if (changes?.name) {
          changeDescriptions.push(`${changes.name.old} → ${changes.name.new}`)
        }
        if (changes?.slug) {
          changeDescriptions.push(`Slug: ${changes.slug.old} → ${changes.slug.new}`)
        }
        title = "✏️ Thẻ tag đã cập nhật"
        description = `${actorName} đã cập nhật "${tag.name}"${
          changeDescriptions.length > 0 ? `: ${changeDescriptions.join(", ")}` : ""
        }`
        break
      case "delete":
        title = "🗑️ Thẻ tag đã xóa"
        description = `${actorName} đã xóa "${tag.name}"`
        break
      case "restore":
        title = "♻️ Thẻ tag đã khôi phục"
        description = `${actorName} đã khôi phục "${tag.name}"`
        break
      case "hard-delete":
        title = "⚠️ Thẻ tag đã xóa vĩnh viễn"
        description = `${actorName} đã xóa vĩnh viễn "${tag.name}"`
        break
    }

    const result = await createNotificationForSuperAdmins(
      title,
      description,
      actionUrl,
      NotificationKind.SYSTEM,
      {
        type: `tag_${action}`,
        actorId,
        actorName: actor?.name || actor?.email,
        actorEmail: actor?.email,
        tagId: tag.id,
        tagName: tag.name,
        tagSlug: tag.slug,
        ...(changes && { changes }),
        timestamp: new Date().toISOString(),
      }
    )

    const io = getSocketServer()
    if (io && result.count > 0) {
      const superAdmins = await prisma.user.findMany({
        where: {
          isActive: true,
          deletedAt: null,
          userRoles: {
            some: {
              role: {
                name: "super_admin",
                isActive: true,
                deletedAt: null,
              },
            },
          },
        },
        select: { id: true },
      })

      const createdNotifications = await prisma.notification.findMany({
        where: {
          title,
          description,
          actionUrl,
          kind: NotificationKind.SYSTEM,
          userId: {
            in: superAdmins.map((a) => a.id),
          },
          createdAt: {
            gte: new Date(Date.now() - 5000),
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: superAdmins.length,
      })

      for (const admin of superAdmins) {
        const dbNotification = createdNotifications.find((n) => n.userId === admin.id)
        
        if (dbNotification) {
          const socketNotification = mapNotificationToPayload(dbNotification)
          storeNotificationInCache(admin.id, socketNotification)
          io.to(`user:${admin.id}`).emit("notification:new", socketNotification)
        } else {
          const fallbackNotification = {
            id: `tag-${action}-${tag.id}-${Date.now()}`,
            kind: "system" as const,
            title,
            description,
            actionUrl,
            timestamp: Date.now(),
            read: false,
            toUserId: admin.id,
            metadata: {
              type: `tag_${action}`,
              actorId,
              tagId: tag.id,
              tagName: tag.name,
              ...(changes && { changes }),
            },
          }
          storeNotificationInCache(admin.id, fallbackNotification)
          io.to(`user:${admin.id}`).emit("notification:new", fallbackNotification)
        }
      }

      if (createdNotifications.length > 0) {
        const roleNotification = mapNotificationToPayload(createdNotifications[0])
        io.to("role:super_admin").emit("notification:new", roleNotification)
      }
    }

    resourceLogger.actionFlow({
      resource: "tags",
      action: action,
      step: "success",
      duration: Date.now() - startTime,
      metadata: { tagId: tag.id, tagName: tag.name },
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    resourceLogger.actionFlow({
      resource: "tags",
      action: action,
      step: "error",
      duration: Date.now() - startTime,
      metadata: { 
        tagId: tag.id, 
        tagName: tag.name,
        error: errorMessage,
        errorStack: error instanceof Error ? error.stack : undefined,
      },
    })
  }
}

/**
 * Bulk notification cho bulk operations - emit một notification tổng hợp thay vì từng cái một
 * Tối ưu để tránh timeout khi xử lý nhiều tags và rút gọn thông báo
 * Đảm bảo hiển thị được tên records bị xóa/khôi phục
 */
export async function notifySuperAdminsOfBulkTagAction(
  action: "delete" | "restore" | "hard-delete",
  actorId: string,
  count: number,
  tags?: Array<{ name: string }>
) {
  const startTime = Date.now()
  
  resourceLogger.actionFlow({
    resource: "tags",
    action: action === "delete" ? "bulk-delete" : action === "restore" ? "bulk-restore" : "bulk-hard-delete",
    step: "start",
    metadata: { count, tagCount: tags?.length || 0, actorId },
  })

  try {
    const actor = await getActorInfo(actorId)
    const actorName = actor?.name || actor?.email || "Hệ thống"

    let title = ""
    let description = ""

    // Format tag names - hiển thị tối đa 5 tên đầu tiên
    const namesText = tags && tags.length > 0 ? formatTagNames(tags, 5) : ""

    switch (action) {
      case "delete":
        title = "🗑️ Nhiều thẻ tag đã xóa"
        description = namesText 
          ? `${actorName} đã xóa ${count} thẻ tag: ${namesText}`
          : `${actorName} đã xóa ${count} thẻ tag`
        break
      case "restore":
        title = "♻️ Nhiều thẻ tag đã khôi phục"
        description = namesText
          ? `${actorName} đã khôi phục ${count} thẻ tag: ${namesText}`
          : `${actorName} đã khôi phục ${count} thẻ tag`
        break
      case "hard-delete":
        title = "⚠️ Nhiều thẻ tag đã xóa vĩnh viễn"
        description = namesText
          ? `${actorName} đã xóa vĩnh viễn ${count} thẻ tag: ${namesText}`
          : `${actorName} đã xóa vĩnh viễn ${count} thẻ tag`
        break
    }

    const actionUrl = `/admin/tags`

    const result = await createNotificationForSuperAdmins(
      title,
      description,
      actionUrl,
      NotificationKind.SYSTEM,
      {
        type: `tag_bulk_${action}`,
        actorId,
        actorName: actor?.name || actor?.email,
        actorEmail: actor?.email,
        count,
        tagNames: tags?.map(t => t.name) || [],
        timestamp: new Date().toISOString(),
      }
    )

    const io = getSocketServer()
    if (io && result.count > 0) {
      const superAdmins = await prisma.user.findMany({
        where: {
          isActive: true,
          deletedAt: null,
          userRoles: {
            some: {
              role: {
                name: "super_admin",
                isActive: true,
                deletedAt: null,
              },
            },
          },
        },
        select: { id: true },
      })

      const createdNotifications = await prisma.notification.findMany({
        where: {
          title,
          description,
          actionUrl,
          kind: NotificationKind.SYSTEM,
          userId: {
            in: superAdmins.map((a) => a.id),
          },
          createdAt: {
            gte: new Date(Date.now() - 5000),
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: superAdmins.length,
      })

      for (const admin of superAdmins) {
        const dbNotification = createdNotifications.find((n) => n.userId === admin.id)
        if (dbNotification) {
          const socketNotification = mapNotificationToPayload(dbNotification)
          storeNotificationInCache(admin.id, socketNotification)
          io.to(`user:${admin.id}`).emit("notification:new", socketNotification)
        }
      }

      if (createdNotifications.length > 0) {
        const roleNotification = mapNotificationToPayload(createdNotifications[0])
        io.to("role:super_admin").emit("notification:new", roleNotification)
      }
    }

    resourceLogger.actionFlow({
      resource: "tags",
      action: action === "delete" ? "bulk-delete" : action === "restore" ? "bulk-restore" : "bulk-hard-delete",
      step: "success",
      duration: Date.now() - startTime,
      metadata: { count, tagCount: tags?.length || 0 },
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    resourceLogger.actionFlow({
      resource: "tags",
      action: action === "delete" ? "bulk-delete" : action === "restore" ? "bulk-restore" : "bulk-hard-delete",
      step: "error",
      duration: Date.now() - startTime,
      metadata: { 
        count, 
        tagCount: tags?.length || 0,
        error: errorMessage,
        errorStack: error instanceof Error ? error.stack : undefined,
      },
    })
  }
}

