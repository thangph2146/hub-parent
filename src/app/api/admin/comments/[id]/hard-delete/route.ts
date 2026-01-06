/**
 * API Route: DELETE /api/admin/comments/[id]/hard-delete - Hard delete comment
 */
import { NextRequest } from "next/server"
import {
  hardDeleteComment,
  type AuthContext,
  ApplicationError,
  NotFoundError,
} from "@/features/admin/comments/server/mutations"
import { createDeleteRoute } from "@/lib/api/api-route-wrapper"
import type { ApiRouteContext } from "@/lib/api/types"
import { createErrorResponse, createSuccessResponse } from "@/lib/config"
import { logger } from "@/lib/config/logger"

async function hardDeleteCommentHandler(_req: NextRequest, context: ApiRouteContext, ...args: unknown[]) {
  const { params } = args[0] as { params: Promise<{ id: string }> }
  const { id: commentId } = await params

  if (!commentId) {
    return createErrorResponse("Comment ID is required", { status: 400 })
  }

  const ctx: AuthContext = {
    actorId: context.session.user?.id ?? "unknown",
    permissions: context.permissions,
    roles: context.roles,
  }

  try {
    await hardDeleteComment(ctx, commentId)
    return createSuccessResponse({ message: "Comment permanently deleted" })
  } catch (error) {
    if (error instanceof ApplicationError) {
      return createErrorResponse(error.message || "Không thể xóa vĩnh viễn bình luận", { status: error.status || 400 })
    }
    if (error instanceof NotFoundError) {
      return createErrorResponse(error.message || "Không tìm thấy", { status: 404 })
    }
    logger.error("Error hard deleting comment", { error, commentId })
    return createErrorResponse("Đã xảy ra lỗi khi xóa vĩnh viễn bình luận", { status: 500 })
  }
}

export const DELETE = createDeleteRoute(hardDeleteCommentHandler)
