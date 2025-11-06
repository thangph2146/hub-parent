/**
 * API Route: POST /api/admin/categories/[id]/restore - Restore category
 */
import { NextRequest, NextResponse } from "next/server"
import {
  restoreCategory,
  type AuthContext,
  ApplicationError,
  NotFoundError,
} from "@/features/admin/categories/server/mutations"
import { createPostRoute } from "@/lib/api/api-route-wrapper"
import type { ApiRouteContext } from "@/lib/api/types"

async function restoreCategoryHandler(_req: NextRequest, context: ApiRouteContext, ...args: unknown[]) {
  const { params } = args[0] as { params: Promise<{ id: string }> }
  const { id: categoryId } = await params

  if (!categoryId) {
    return NextResponse.json({ error: "Category ID is required" }, { status: 400 })
  }

  const ctx: AuthContext = {
    actorId: context.session.user?.id ?? "unknown",
    permissions: context.permissions,
    roles: context.roles,
  }

  try {
    await restoreCategory(ctx, categoryId)
    return NextResponse.json({ message: "Category restored successfully" })
  } catch (error) {
    if (error instanceof ApplicationError) {
      return NextResponse.json({ error: error.message || "Không thể khôi phục danh mục" }, { status: error.status || 400 })
    }
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message || "Không tìm thấy" }, { status: 404 })
    }
    console.error("Error restoring category:", error)
    return NextResponse.json({ error: "Đã xảy ra lỗi khi khôi phục danh mục" }, { status: 500 })
  }
}

export const POST = createPostRoute(restoreCategoryHandler)

