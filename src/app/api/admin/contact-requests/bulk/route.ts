/**
 * API Route: POST /api/admin/contact-requests/bulk - Bulk operations
 */
import { NextRequest } from "next/server"
import {
  bulkSoftDeleteContactRequests,
  bulkRestoreContactRequests,
  bulkHardDeleteContactRequests,
  bulkMarkAsReadContactRequests,
  bulkMarkAsUnreadContactRequests,
  bulkUpdateStatusContactRequests,
  type AuthContext,
  ApplicationError,
} from "@/features/admin/contact-requests/server/mutations"
import { BulkContactRequestActionSchema } from "@/features/admin/contact-requests/server/schemas"
import { createPostRoute } from "@/lib"
import type { ApiRouteContext } from "@/types"
import { createErrorResponse, createSuccessResponse } from "@/lib"
import { logger } from "@/utils"

async function bulkContactRequestsHandler(req: NextRequest, context: ApiRouteContext) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return createErrorResponse("Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.", { status: 400 })
  }

  // Validate với zod
  const validationResult = BulkContactRequestActionSchema.safeParse(body)
  if (!validationResult.success) {
    const firstError = validationResult.error.issues[0]
    return createErrorResponse(firstError?.message || "Dữ liệu không hợp lệ", { status: 400 })
  }

  const validatedBody = validationResult.data

  const ctx: AuthContext = {
    actorId: context.session.user?.id ?? "unknown",
    permissions: context.permissions,
    roles: context.roles,
  }

  try {
    let result
    if (validatedBody.action === "delete") {
      result = await bulkSoftDeleteContactRequests(ctx, validatedBody.ids)
    } else if (validatedBody.action === "restore") {
      result = await bulkRestoreContactRequests(ctx, validatedBody.ids)
    } else if (validatedBody.action === "hard-delete") {
      result = await bulkHardDeleteContactRequests(ctx, validatedBody.ids)
    } else if (validatedBody.action === "mark-read") {
      result = await bulkMarkAsReadContactRequests(ctx, validatedBody.ids)
    } else if (validatedBody.action === "mark-unread") {
      result = await bulkMarkAsUnreadContactRequests(ctx, validatedBody.ids)
    } else if (validatedBody.action === "update-status") {
      result = await bulkUpdateStatusContactRequests(ctx, validatedBody.ids, validatedBody.status)
    } else {
      return createErrorResponse("Action không hợp lệ", { status: 400 })
    }

    return createSuccessResponse(result)
  } catch (error) {
    if (error instanceof ApplicationError) {
      return createErrorResponse(error.message || "Không thể thực hiện thao tác hàng loạt", { status: error.status || 400 })
    }
    logger.error("Error in bulk contact requests operation", { error, action: validatedBody.action, ids: validatedBody.ids })
    return createErrorResponse("Đã xảy ra lỗi khi thực hiện thao tác hàng loạt", { status: 500 })
  }
}

export const POST = createPostRoute(bulkContactRequestsHandler)

