/**
 * API Route: DELETE /api/admin/categories/[id]/hard-delete - Hard delete category
 */
import { NextRequest } from "next/server"
import {
  hardDeleteCategory,
  type AuthContext,
} from "@/features/admin/categories/server/mutations"
import { createDeleteRoute } from "@/lib"
import type { ApiRouteContext } from "@/types"
import { validateID } from "@/utils"
import { extractParams, createAuthContext, handleApiError } from "@/lib"
import { createErrorResponse, createSuccessResponse } from "@/lib"

async function hardDeleteCategoryHandler(_req: NextRequest, context: ApiRouteContext, ...args: unknown[]) {
  try {
    const { id: categoryId } = await extractParams<{ id: string }>(args)

    const idValidation = validateID(categoryId)
    if (!idValidation.valid) {
      return createErrorResponse(idValidation.error || "Category ID không hợp lệ", { status: 400 })
    }

    const userId = context.session.user?.id ?? "unknown"
    const ctx = createAuthContext(context, userId) as AuthContext

    await hardDeleteCategory(ctx, categoryId)
    return createSuccessResponse({ message: "Category permanently deleted" })
  } catch (error) {
    return handleApiError(error, "Đã xảy ra lỗi khi xóa vĩnh viễn danh mục", 500)
  }
}

export const DELETE = createDeleteRoute(hardDeleteCategoryHandler)
