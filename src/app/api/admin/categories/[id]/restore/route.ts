/**
 * API Route: POST /api/admin/categories/[id]/restore - Restore category
 */
import { NextRequest } from "next/server"
import {
  restoreCategory,
  type AuthContext,
} from "@/features/admin/categories/server/mutations"
import { createPostRoute } from "@/lib/api/api-route-wrapper"
import type { ApiRouteContext } from "@/lib/api/types"
import { validateID } from "@/lib/api/validation"
import { extractParams, createAuthContext, handleApiError } from "@/lib/api/api-route-helpers"
import { createErrorResponse, createSuccessResponse } from "@/lib/config"

async function restoreCategoryHandler(_req: NextRequest, context: ApiRouteContext, ...args: unknown[]) {
  try {
    const { id: categoryId } = await extractParams<{ id: string }>(args)

    const idValidation = validateID(categoryId)
    if (!idValidation.valid) {
      return createErrorResponse(idValidation.error || "Category ID không hợp lệ", { status: 400 })
    }

    const userId = context.session.user?.id ?? "unknown"
    const ctx = createAuthContext(context, userId) as AuthContext

    await restoreCategory(ctx, categoryId)
    return createSuccessResponse({ message: "Category restored successfully" })
  } catch (error) {
    return handleApiError(error, "Đã xảy ra lỗi khi khôi phục danh mục", 500)
  }
}

export const POST = createPostRoute(restoreCategoryHandler)
