/**
 * API Route để mark tất cả notifications là đã đọc
 */
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/database"
import { PERMISSIONS } from "@/lib/permissions"
import { getNotificationCache, getSocketServer } from "@/lib/socket/state"
import { createPostRoute } from "@/lib/api/api-route-wrapper"

async function markAllReadHandler(
  _req: NextRequest,
  context: {
    session: Awaited<ReturnType<typeof import("@/lib/auth").requireAuth>>
    permissions: import("@/lib/permissions").Permission[]
    roles: Array<{ name: string }>
  }
) {
  const result = await prisma.notification.updateMany({
    where: {
      userId: context.session.user.id,
      isRead: false,
    },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  })

  if (result.count > 0) {
    const cache = getNotificationCache()
    const notifications = cache.get(context.session.user.id)
    if (notifications) {
      notifications.forEach((notification) => {
        notification.read = true
      })
      const io = getSocketServer()
      if (io) {
        io.to(`user:${context.session.user.id}`).emit("notifications:sync", notifications)
      }
    }
  }

  return NextResponse.json({
    success: true,
    count: result.count,
  })
}

export const POST = createPostRoute(markAllReadHandler, {
  permissions: PERMISSIONS.NOTIFICATIONS_VIEW,
})
