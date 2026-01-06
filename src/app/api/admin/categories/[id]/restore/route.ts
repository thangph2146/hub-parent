/**
 * API Route: POST /api/admin/categories/[id]/restore - Restore category
 */
import { NextRequest } from "next/server"
import {
  restoreCategory,
  type AuthContext,
  ApplicationError,
  NotFoundError,
} from "@/features/admin/categories/server/mutations"
import { createPostRoute } from "@/lib/api/api-route-wrapper"
import type { ApiRouteContext } from "@/lib/api/types"
import { createErrorResponse, createSuccessResponse } from "@/lib/config"
import { logger } from "@/lib/config/logger"

async function restoreCategoryHandler(_req: NextRequest, context: ApiRouteContext, ...args: unknown[]) {
  const { params } = args[0] as { params: Promise<{ id: string }> }
  const { id: categoryId } = await params

  if (!categoryId) {
    return createErrorResponse("Category ID is required", { status: 400 })
  }

  const ctx: AuthContext = {
    actorId: context.session.user?.id ?? "unknown",
    permissions: context.permissions,
    roles: context.roles,
  }

  try {
    await restoreCategory(ctx, categoryId)
    return createSuccessResponse({ message: "Category restored successfully" })
  } catch (error) {
    if (error instanceof ApplicationError) {
      return createErrorResponse(error.message || "Không thể khôi phục danh mục", { status: error.status || 400 })
    }
    if (error instanceof NotFoundError) {
      return createErrorResponse(error.message || "Không tìm thấy", { status: 404 })
    }
    logger.error("Error restoring category", { error, categoryId })
    return createErrorResponse("Đã xảy ra lỗi khi khôi phục danh mục", { status: 500 })
  }
}

export const POST = createPostRoute(restoreCategoryHandler)
