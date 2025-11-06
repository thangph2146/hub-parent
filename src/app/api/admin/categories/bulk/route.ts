/**
 * API Route: POST /api/admin/categories/bulk - Bulk operations
 */
import { NextRequest, NextResponse } from "next/server"
import {
  bulkSoftDeleteCategories,
  bulkRestoreCategories,
  bulkHardDeleteCategories,
  type AuthContext,
  ApplicationError,
} from "@/features/admin/categories/server/mutations"
import { createPostRoute } from "@/lib/api/api-route-wrapper"
import type { ApiRouteContext } from "@/lib/api/types"

async function bulkCategoriesHandler(req: NextRequest, context: ApiRouteContext) {
  let body: { action: "delete" | "restore" | "hard-delete"; ids: string[] }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Dữ liệu không hợp lệ. Vui lòng kiểm tra lại." }, { status: 400 })
  }

  if (!body.action || !body.ids || !Array.isArray(body.ids) || body.ids.length === 0) {
    return NextResponse.json({ error: "Action và ids là bắt buộc" }, { status: 400 })
  }

  const ctx: AuthContext = {
    actorId: context.session.user?.id ?? "unknown",
    permissions: context.permissions,
    roles: context.roles,
  }

  try {
    let result
    if (body.action === "delete") {
      result = await bulkSoftDeleteCategories(ctx, body.ids)
    } else if (body.action === "restore") {
      result = await bulkRestoreCategories(ctx, body.ids)
    } else if (body.action === "hard-delete") {
      result = await bulkHardDeleteCategories(ctx, body.ids)
    } else {
      return NextResponse.json({ error: "Action không hợp lệ" }, { status: 400 })
    }

    return NextResponse.json({ data: result })
  } catch (error) {
    if (error instanceof ApplicationError) {
      return NextResponse.json({ error: error.message || "Không thể thực hiện thao tác hàng loạt" }, { status: error.status || 400 })
    }
    console.error("Error in bulk categories operation:", error)
    return NextResponse.json({ error: "Đã xảy ra lỗi khi thực hiện thao tác hàng loạt" }, { status: 500 })
  }
}

export const POST = createPostRoute(bulkCategoriesHandler)

