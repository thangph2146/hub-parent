/**
 * API Route: POST /api/admin/posts/[id]/restore - Restore post
 */
import { NextRequest } from "next/server"
import {
  restorePost,
  type AuthContext,
} from "@/features/admin/posts/server/mutations"
import { createPostRoute } from "@/lib"
import type { ApiRouteContext } from "@/types"
import { validateID } from "@/utils"
import { extractParams, createAuthContext, handleApiError } from "@/lib"
import { createErrorResponse, createSuccessResponse } from "@/lib"

async function restorePostHandler(_req: NextRequest, context: ApiRouteContext, ...args: unknown[]) {
  try {
    const { id: postId } = await extractParams<{ id: string }>(args)

    const idValidation = validateID(postId)
    if (!idValidation.valid) {
      return createErrorResponse(idValidation.error || "Post ID không hợp lệ", { status: 400 })
    }

    const userId = context.session.user?.id ?? "unknown"
    const ctx = createAuthContext(context, userId) as AuthContext

    await restorePost(ctx, postId)
    return createSuccessResponse({ message: "Post restored successfully" })
  } catch (error) {
    return handleApiError(error, "Đã xảy ra lỗi khi khôi phục bài viết", 500)
  }
}

export const POST = createPostRoute(restorePostHandler)

