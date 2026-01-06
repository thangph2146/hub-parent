/**
 * API Route: POST /api/admin/posts/bulk - Bulk operations
 */
import { NextRequest } from "next/server"
import { bulkPostsAction, type AuthContext } from "@/features/admin/posts/server/mutations"
import { createPostRoute } from "@/lib/api/api-route-wrapper"
import type { ApiRouteContext } from "@/lib/api/types"
import { createErrorResponse, createSuccessResponse } from "@/lib/config"
import { parseRequestBody, createAuthContext, handleApiError } from "@/lib/api/api-route-helpers"
import { z } from "zod"

const BulkPostActionSchema = z.object({
  action: z.enum(["delete", "restore", "hard-delete"]),
  ids: z.array(z.string().cuid("ID không hợp lệ")).min(1, "Danh sách ID không được trống"),
})

async function bulkPostsHandler(req: NextRequest, context: ApiRouteContext) {
  try {
    const body = await parseRequestBody(req)

    // Validate với zod
    const validationResult = BulkPostActionSchema.safeParse(body)
    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0]
      return createErrorResponse(firstError?.message || "Dữ liệu không hợp lệ", { status: 400 })
    }

    const validatedBody = validationResult.data

    const userId = context.session.user?.id ?? "unknown"
    const ctx = createAuthContext(context, userId) as AuthContext

    const result = await bulkPostsAction(ctx, validatedBody.action, validatedBody.ids)
    return createSuccessResponse(result)
  } catch (error) {
    return handleApiError(error, "Đã xảy ra lỗi khi thực hiện thao tác hàng loạt", 500)
  }
}

export const POST = createPostRoute(bulkPostsHandler)

