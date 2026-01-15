/**
 * API Route: 
 * - PATCH /api/notifications/[id] - Update notification (mark as read/unread)
 * - DELETE /api/notifications/[id] - Delete notification (chỉ thông báo cá nhân, không cho phép xóa SYSTEM)
 */
import { NextRequest } from "next/server"
import { auth } from "@/auth/server"
import { deleteNotification, markNotificationAsRead, markNotificationAsUnread } from "@/features/admin/notifications/server/mutations"
import { getSocketServer } from "@/services/socket/state"
import { mapNotificationToPayload } from "@/services/socket/state"
import { createErrorResponse, createSuccessResponse } from "@/lib"
import { logger } from "@/utils"
import { isSuperAdmin } from "@/permissions"

async function patchNotificationHandler(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()

  if (!session?.user?.id) {
    return createErrorResponse("Unauthorized", { status: 401 })
  }

  const { id } = await params
  const body = await req.json().catch(() => ({}))
  const { isRead } = body

  const isSuperAdminUser = isSuperAdmin(session.roles || [])

  try {
    const updated = isRead === true || isRead === "true"
      ? await markNotificationAsRead(id, session.user.id, isSuperAdminUser)
      : await markNotificationAsUnread(id, session.user.id, isSuperAdminUser)

    if (!updated) {
      return createErrorResponse("Failed to update notification", { status: 500 })
    }

    // Emit socket event để đồng bộ real-time với các clients khác
    const io = getSocketServer()
    if (io && updated.userId) {
      try {
        const payload = mapNotificationToPayload(updated)
        io.to(`user:${updated.userId}`).emit("notification:updated", payload)
      } catch (error) {
        logger.warn("Failed to emit socket event for notification update", { error, userId: updated.userId })
      }
    }

    return createSuccessResponse({
      id: updated.id,
      userId: updated.userId,
      kind: updated.kind,
      title: updated.title,
      description: updated.description,
      isRead: updated.isRead,
      actionUrl: updated.actionUrl,
      metadata: updated.metadata as Record<string, unknown> | null,
      expiresAt: updated.expiresAt,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
      readAt: updated.readAt,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error"
    if (message.includes("Forbidden")) {
      return createErrorResponse(message, { status: 403 })
    }
    if (message.includes("not found")) {
      return createErrorResponse(message, { status: 404 })
    }
    throw error
  }
}

async function deleteNotificationHandler(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()

  if (!session?.user?.id) {
    return createErrorResponse("Unauthorized", { status: 401 })
  }

  const { id } = await params
  const isSuperAdminUser = isSuperAdmin(session.roles || [])

  try {
    await deleteNotification(id, session.user.id, isSuperAdminUser)
    return createSuccessResponse({ success: true })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Internal server error"
    
    // Handle specific error cases
    if (errorMessage.includes("cannot be deleted")) {
      return createErrorResponse("Thông báo hệ thống không thể xóa", { status: 403 })
    }
    if (errorMessage.includes("Forbidden") || errorMessage.includes("only delete")) {
      return createErrorResponse("Bạn chỉ có thể xóa thông báo của chính mình", { status: 403 })
    }
    if (errorMessage.includes("not found")) {
      return createErrorResponse("Không tìm thấy thông báo", { status: 404 })
    }
    
    logger.error("Error deleting notification", { error, notificationId: id, userId: session.user.id })
    return createErrorResponse("Internal server error", { status: 500 })
  }
}

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    return await patchNotificationHandler(req, context)
  } catch (error) {
    logger.error("Error updating notification", { error })
    return createErrorResponse("Internal server error", { status: 500 })
  }
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    return await deleteNotificationHandler(req, context)
  } catch (error) {
    logger.error("Error deleting notification", { error })
    return createErrorResponse("Internal server error", { status: 500 })
  }
}
