/**
 * API Route: POST /api/admin/tags/[id]/restore - Restore tag
 */
import { NextRequest } from "next/server"
import {
  restoreTag,
  type AuthContext,
} from "@/features/admin/tags/server/mutations"
import { createPostRoute } from "@/lib"
import type { ApiRouteContext } from "@/types"
import { validateID } from "@/utils"
import { extractParams, createAuthContext, handleApiError } from "@/lib"
import { createSuccessResponse, createErrorResponse } from "@/lib"

async function restoreTagHandler(_req: NextRequest, context: ApiRouteContext, ...args: unknown[]) {
  try {
    const { id: tagId } = await extractParams<{ id: string }>(args)

    const idValidation = validateID(tagId)
    if (!idValidation.valid) {
      return createErrorResponse(idValidation.error || "Tag ID không hợp lệ", { status: 400 })
    }

    const userId = context.session.user?.id ?? "unknown"
    const ctx = createAuthContext(context, userId) as AuthContext

    await restoreTag(ctx, tagId)
    return createSuccessResponse({ message: "Tag restored successfully" })
  } catch (error) {
    return handleApiError(error, "Đã xảy ra lỗi khi khôi phục thẻ tag", 500)
  }
}

export const POST = createPostRoute(restoreTagHandler)

