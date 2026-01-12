/**
 * API Route: DELETE /api/admin/comments/[id]/hard-delete - Hard delete comment
 */
import { NextRequest } from "next/server"
import {
  hardDeleteComment,
  type AuthContext,
} from "@/features/admin/comments/server/mutations"
import { createDeleteRoute } from "@/lib"
import type { ApiRouteContext } from "@/types"
import { validateID } from "@/utils"
import { extractParams, createAuthContext, handleApiError } from "@/lib"
import { createErrorResponse, createSuccessResponse } from "@/lib"

async function hardDeleteCommentHandler(_req: NextRequest, context: ApiRouteContext, ...args: unknown[]) {
  try {
    const { id: commentId } = await extractParams<{ id: string }>(args)

    const idValidation = validateID(commentId)
    if (!idValidation.valid) {
      return createErrorResponse(idValidation.error || "Comment ID không hợp lệ", { status: 400 })
    }

    const userId = context.session.user?.id ?? "unknown"
    const ctx = createAuthContext(context, userId) as AuthContext

    await hardDeleteComment(ctx, commentId)
    return createSuccessResponse({ message: "Comment permanently deleted" })
  } catch (error) {
    return handleApiError(error, "Đã xảy ra lỗi khi xóa vĩnh viễn bình luận", 500)
  }
}

export const DELETE = createDeleteRoute(hardDeleteCommentHandler)
