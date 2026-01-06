/**
 * API Route: POST /api/admin/comments/[id]/unapprove - Unapprove comment
 */
import { NextRequest } from "next/server"
import {
  unapproveComment,
  type AuthContext,
} from "@/features/admin/comments/server/mutations"
import { createPostRoute } from "@/lib/api/api-route-wrapper"
import type { ApiRouteContext } from "@/lib/api/types"
import { validateID } from "@/lib/api/validation"
import { extractParams, createAuthContext, handleApiError } from "@/lib/api/api-route-helpers"
import { createSuccessResponse, createErrorResponse } from "@/lib/config"
import { resourceLogger } from "@/lib/config"

async function unapproveCommentHandler(_req: NextRequest, context: ApiRouteContext, ...args: unknown[]) {
  try {
    const { id: commentId } = await extractParams<{ id: string }>(args)

    const idValidation = validateID(commentId)
    if (!idValidation.valid) {
      return createErrorResponse(idValidation.error || "Comment ID không hợp lệ", { status: 400 })
    }

    const userId = context.session.user?.id ?? "unknown"
    const ctx = createAuthContext(context, userId) as AuthContext

    await unapproveComment(ctx, commentId)
    return createSuccessResponse({ message: "Comment unapproved successfully" })
  } catch (error) {
    resourceLogger.actionFlow({
      resource: "comments",
      action: "unapprove",
      step: "error",
      metadata: { 
        error: error instanceof Error ? error.message : "Unknown error",
      },
    })
    return handleApiError(error, "Đã xảy ra lỗi khi hủy duyệt bình luận", 500)
  }
}

export const POST = createPostRoute(unapproveCommentHandler)

