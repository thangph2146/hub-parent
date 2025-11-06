/**
 * API Route: GET /api/admin/categories/[id] - Get category
 * PUT /api/admin/categories/[id] - Update category
 * DELETE /api/admin/categories/[id] - Soft delete category
 */
import { NextRequest, NextResponse } from "next/server"
import { getCategoryDetailById } from "@/features/admin/categories/server/cache"
import { serializeCategoryDetail } from "@/features/admin/categories/server/helpers"
import {
  updateCategory,
  softDeleteCategory,
  type AuthContext,
  ApplicationError,
  NotFoundError,
} from "@/features/admin/categories/server/mutations"
import type { UpdateCategoryInput } from "@/features/admin/categories/types"
import { createGetRoute, createPutRoute, createDeleteRoute } from "@/lib/api/api-route-wrapper"
import type { ApiRouteContext } from "@/lib/api/types"

async function getCategoryHandler(_req: NextRequest, _context: ApiRouteContext, ...args: unknown[]) {
  const { params } = args[0] as { params: Promise<{ id: string }> }
  const { id: categoryId } = await params

  if (!categoryId) {
    return NextResponse.json({ error: "Category ID is required" }, { status: 400 })
  }

  const category = await getCategoryDetailById(categoryId)

  if (!category) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 })
  }

  return NextResponse.json({ data: serializeCategoryDetail(category) })
}

async function putCategoryHandler(req: NextRequest, context: ApiRouteContext, ...args: unknown[]) {
  const { params } = args[0] as { params: Promise<{ id: string }> }
  const { id: categoryId } = await params

  if (!categoryId) {
    return NextResponse.json({ error: "Category ID is required" }, { status: 400 })
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Dữ liệu không hợp lệ. Vui lòng kiểm tra lại." }, { status: 400 })
  }

  const ctx: AuthContext = {
    actorId: context.session.user?.id ?? "unknown",
    permissions: context.permissions,
    roles: context.roles,
  }

  try {
    const category = await updateCategory(ctx, categoryId, body as unknown as UpdateCategoryInput)
    // Serialize category to client format (dates to strings)
    const serialized = {
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      createdAt: category.createdAt.toISOString(),
      deletedAt: category.deletedAt ? category.deletedAt.toISOString() : null,
    }
    return NextResponse.json({ data: serialized })
  } catch (error) {
    if (error instanceof ApplicationError) {
      return NextResponse.json({ error: error.message || "Không thể cập nhật danh mục" }, { status: error.status || 400 })
    }
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message || "Không tìm thấy" }, { status: 404 })
    }
    console.error("Error updating category:", error)
    return NextResponse.json({ error: "Đã xảy ra lỗi khi cập nhật danh mục" }, { status: 500 })
  }
}

async function deleteCategoryHandler(_req: NextRequest, context: ApiRouteContext, ...args: unknown[]) {
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
    await softDeleteCategory(ctx, categoryId)
    return NextResponse.json({ message: "Category deleted successfully" })
  } catch (error) {
    if (error instanceof ApplicationError) {
      return NextResponse.json({ error: error.message || "Không thể xóa danh mục" }, { status: error.status || 400 })
    }
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message || "Không tìm thấy" }, { status: 404 })
    }
    console.error("Error deleting category:", error)
    return NextResponse.json({ error: "Đã xảy ra lỗi khi xóa danh mục" }, { status: 500 })
  }
}

export const GET = createGetRoute(getCategoryHandler)
export const PUT = createPutRoute(putCategoryHandler)
export const DELETE = createDeleteRoute(deleteCategoryHandler)

