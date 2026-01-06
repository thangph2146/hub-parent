/**
 * API Route: POST /api/admin/posts/[id]/restore - Restore post
 */
import { NextRequest } from "next/server"
import {
  restorePost,
  type AuthContext,
  ApplicationError,
  NotFoundError,
} from "@/features/admin/posts/server/mutations"
import { createPostRoute } from "@/lib/api/api-route-wrapper"
import type { ApiRouteContext } from "@/lib/api/types"
import { createErrorResponse, createSuccessResponse } from "@/lib/config"
import { logger } from "@/lib/config/logger"

async function restorePostHandler(_req: NextRequest, context: ApiRouteContext, ...args: unknown[]) {
  const { params } = args[0] as { params: Promise<{ id: string }> }
  const { id: postId } = await params

  if (!postId) {
    return createErrorResponse("Post ID is required", { status: 400 })
  }

  const ctx: AuthContext = {
    actorId: context.session.user?.id ?? "unknown",
    permissions: context.permissions,
    roles: context.roles,
  }

  try {
    await restorePost(ctx, postId)
    return createSuccessResponse({ message: "Post restored successfully" })
  } catch (error) {
    if (error instanceof ApplicationError) {
      return createErrorResponse(error.message || "Không thể khôi phục bài viết", { status: error.status || 400 })
    }
    if (error instanceof NotFoundError) {
      return createErrorResponse(error.message || "Không tìm thấy", { status: 404 })
    }
    logger.error("Error restoring post", { error, postId })
    return createErrorResponse("Đã xảy ra lỗi khi khôi phục bài viết", { status: 500 })
  }
}

export const POST = createPostRoute(restorePostHandler)

