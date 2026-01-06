/**
 * API Route: DELETE /api/admin/posts/[id]/hard-delete - Hard delete post
 */
import { NextRequest } from "next/server"
import {
  hardDeletePost,
  type AuthContext,
} from "@/features/admin/posts/server/mutations"
import { createDeleteRoute } from "@/lib/api/api-route-wrapper"
import type { ApiRouteContext } from "@/lib/api/types"
import { validateID } from "@/lib/api/validation"
import { extractParams, createAuthContext, handleApiError } from "@/lib/api/api-route-helpers"
import { createErrorResponse, createSuccessResponse } from "@/lib/config"

async function hardDeletePostHandler(_req: NextRequest, context: ApiRouteContext, ...args: unknown[]) {
  try {
    const { id: postId } = await extractParams<{ id: string }>(args)

    const idValidation = validateID(postId)
    if (!idValidation.valid) {
      return createErrorResponse(idValidation.error || "Post ID không hợp lệ", { status: 400 })
    }

    const userId = context.session.user?.id ?? "unknown"
    const ctx = createAuthContext(context, userId) as AuthContext

    await hardDeletePost(ctx, postId)
    return createSuccessResponse({ message: "Post permanently deleted" })
  } catch (error) {
    return handleApiError(error, "Đã xảy ra lỗi khi xóa vĩnh viễn bài viết", 500)
  }
}

export const DELETE = createDeleteRoute(hardDeletePostHandler)

