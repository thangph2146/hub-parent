/**
 * Helper functions để emit notifications realtime cho tags actions
 */

import { prisma } from "@/lib/database"
import { logger } from "@/lib/config"
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
  try {
    logger.debug("[notifySuperAdmins] Starting notification", {
      action,
      actorId,
      tagId: tag.id,
      tagName: tag.name,
      hasChanges: !!changes,
      changesKeys: changes ? Object.keys(changes) : [],
    })

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

    // Tạo notifications trong DB cho tất cả super admins
    logger.debug("[notifySuperAdmins] Creating notifications in DB", {
      title,
      description,
      actionUrl,
      action,
    })
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
    logger.debug("[notifySuperAdmins] Notifications created", {
      count: result.count,
      action,
    })

    // Emit socket event nếu có socket server
    const io = getSocketServer()
    logger.debug("[notifySuperAdmins] Socket server status", {
      hasSocketServer: !!io,
      notificationCount: result.count,
    })
    if (io && result.count > 0) {
      // Lấy danh sách super admins để emit đến từng user room
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

      logger.debug("[notifySuperAdmins] Found super admins", {
        count: superAdmins.length,
        adminIds: superAdmins.map((a) => a.id),
      })

      // Fetch notifications vừa tạo từ database để lấy IDs thực tế
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
            gte: new Date(Date.now() - 5000), // Created within last 5 seconds
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: superAdmins.length,
      })

      // Emit to each super admin user room với notification từ database
      for (let i = 0; i < superAdmins.length; i++) {
        const admin = superAdmins[i]
        const dbNotification = createdNotifications.find((n) => n.userId === admin.id)
        
        if (dbNotification) {
          // Map notification từ database sang socket payload format
          const socketNotification = mapNotificationToPayload(dbNotification)
          storeNotificationInCache(admin.id, socketNotification)
          io.to(`user:${admin.id}`).emit("notification:new", socketNotification)
          logger.debug("[notifySuperAdmins] Emitted to user room", {
            adminId: admin.id,
            room: `user:${admin.id}`,
            notificationId: dbNotification.id,
          })
        } else {
          // Fallback nếu không tìm thấy notification trong database
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
          logger.debug("[notifySuperAdmins] Emitted fallback notification to user room", {
            adminId: admin.id,
            room: `user:${admin.id}`,
          })
        }
      }

      // Also emit to role room for broadcast (use first notification if available)
      if (createdNotifications.length > 0) {
        const roleNotification = mapNotificationToPayload(createdNotifications[0])
        io.to("role:super_admin").emit("notification:new", roleNotification)
        logger.debug("[notifySuperAdmins] Emitted to role room: role:super_admin")
      }
    }
  } catch (error) {
    // Log error nhưng không throw để không ảnh hưởng đến main operation
    logger.error("[notifications] Failed to notify super admins of tag action", error as Error)
  }
}

/**
 * Bulk notification cho bulk operations - emit một notification tổng hợp thay vì từng cái một
 * Để tránh timeout khi xử lý nhiều tags và rút gọn thông báo
 */
export async function notifySuperAdminsOfBulkTagAction(
  action: "delete" | "restore" | "hard-delete",
  actorId: string,
  count: number,
  tags?: Array<{ name: string }>
) {
  try {
    const actor = await getActorInfo(actorId)
    const actorName = actor?.name || actor?.email || "Hệ thống"

    let title = ""
    let description = ""

    // Tạo danh sách tên tags (tối ưu để hiển thị đẹp trong line-clamp-2)
    // Hiển thị tối đa 10 tên, nếu nhiều hơn sẽ hiển thị "... và X thẻ tag khác"
    const maxNames = 10
    const tagNames = tags?.slice(0, maxNames).map(t => t.name) || []
    const remainingCount = tags && tags.length > maxNames ? tags.length - maxNames : 0
    const namesText = tagNames.length > 0 
      ? tagNames.join(", ") + (remainingCount > 0 ? ` và ${remainingCount} thẻ tag khác` : "")
      : ""

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
  } catch (error) {
    logger.error("[notifications] Failed to notify super admins of bulk tag action", error as Error)
  }
}

