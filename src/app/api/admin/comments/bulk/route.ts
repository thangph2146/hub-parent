/**
 * API Route: POST /api/admin/comments/bulk - Bulk operations
 */
import { NextRequest } from "next/server"
import {
  bulkSoftDeleteComments,
  bulkRestoreComments,
  bulkHardDeleteComments,
  bulkApproveComments,
  bulkUnapproveComments,
  type AuthContext,
} from "@/features/admin/comments/server/mutations"
import { BulkCommentActionSchema } from "@/features/admin/comments/server/schemas"
import { createPostRoute } from "@/lib"
import type { ApiRouteContext } from "@/types"
import { createErrorResponse, createSuccessResponse } from "@/lib"
import { resourceLogger } from "@/utils"
import { parseRequestBody, createAuthContext, handleApiError } from "@/lib"

async function bulkCommentsHandler(req: NextRequest, context: ApiRouteContext) {
  try {
    const body = await parseRequestBody(req)

    // Validate với zod
    const validationResult = BulkCommentActionSchema.safeParse(body)
    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0]
      resourceLogger.logFlow({
        resource: "comments",
        action: "error",
        step: "error",
        details: { 
          error: "Validation failed", 
          validationError: firstError?.message,
          body,
        },
      })
      return createErrorResponse(firstError?.message || "Dữ liệu không hợp lệ", { status: 400 })
    }

    const validatedBody = validationResult.data

    const userId = context.session.user?.id ?? "unknown"
    const ctx = createAuthContext(context, userId) as AuthContext

    let result
    if (validatedBody.action === "delete") {
      result = await bulkSoftDeleteComments(ctx, validatedBody.ids)
    } else if (validatedBody.action === "restore") {
      result = await bulkRestoreComments(ctx, validatedBody.ids)
    } else if (validatedBody.action === "hard-delete") {
      result = await bulkHardDeleteComments(ctx, validatedBody.ids)
    } else if (validatedBody.action === "approve") {
      result = await bulkApproveComments(ctx, validatedBody.ids)
    } else if (validatedBody.action === "unapprove") {
      result = await bulkUnapproveComments(ctx, validatedBody.ids)
    } else {
      resourceLogger.logFlow({
        resource: "comments",
        action: "error",
        step: "error",
        details: { error: "Invalid action", action: validatedBody.action },
      })
      return createErrorResponse("Action không hợp lệ", { status: 400 })
    }

    return createSuccessResponse(result)
  } catch (error) {
    resourceLogger.logFlow({
      resource: "comments",
      action: "error",
      step: "error",
      details: { 
        error: "Unknown error",
        errorMessage: error instanceof Error ? error.message : String(error),
      },
    })
    return handleApiError(error, "Đã xảy ra lỗi khi thực hiện thao tác hàng loạt", 500)
  }
}

export const POST = createPostRoute(bulkCommentsHandler)
