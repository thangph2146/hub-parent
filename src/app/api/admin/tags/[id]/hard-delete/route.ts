/**
 * API Route: DELETE /api/admin/tags/[id]/hard-delete - Hard delete tag
 */
import { NextRequest } from "next/server"
import {
  hardDeleteTag,
  type AuthContext,
} from "@/features/admin/tags/server/mutations"
import { createDeleteRoute } from "@/lib/api/api-route-wrapper"
import type { ApiRouteContext } from "@/lib/api/types"
import { validateID } from "@/lib/api/validation"
import { extractParams, createAuthContext, handleApiError } from "@/lib/api/api-route-helpers"
import { createSuccessResponse, createErrorResponse } from "@/lib/config"

async function hardDeleteTagHandler(_req: NextRequest, context: ApiRouteContext, ...args: unknown[]) {
  try {
    const { id: tagId } = await extractParams<{ id: string }>(args)

    const idValidation = validateID(tagId)
    if (!idValidation.valid) {
      return createErrorResponse(idValidation.error || "Tag ID không hợp lệ", { status: 400 })
    }

    const userId = context.session.user?.id ?? "unknown"
    const ctx = createAuthContext(context, userId) as AuthContext

    await hardDeleteTag(ctx, tagId)
    return createSuccessResponse({ message: "Tag permanently deleted" })
  } catch (error) {
    return handleApiError(error, "Đã xảy ra lỗi khi xóa vĩnh viễn thẻ tag", 500)
  }
}

export const DELETE = createDeleteRoute(hardDeleteTagHandler)

