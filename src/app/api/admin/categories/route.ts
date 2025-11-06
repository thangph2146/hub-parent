/**
 * API Route: GET /api/admin/categories - List categories
 * POST /api/admin/categories - Create category
 */
import { NextRequest, NextResponse } from "next/server"
import { listCategoriesCached } from "@/features/admin/categories/server/cache"
import { serializeCategoriesList } from "@/features/admin/categories/server/helpers"
import {
  createCategory,
  type AuthContext,
  ApplicationError,
  NotFoundError,
} from "@/features/admin/categories/server/mutations"
import { createGetRoute, createPostRoute } from "@/lib/api/api-route-wrapper"
import type { ApiRouteContext } from "@/lib/api/types"
import { validatePagination, sanitizeSearchQuery } from "@/lib/api/validation"

async function getCategoriesHandler(req: NextRequest, _context: ApiRouteContext) {
  const searchParams = req.nextUrl.searchParams

  const paginationValidation = validatePagination({
    page: searchParams.get("page"),
    limit: searchParams.get("limit"),
  })

  if (!paginationValidation.valid) {
    return NextResponse.json({ error: paginationValidation.error }, { status: 400 })
  }

  const searchValidation = sanitizeSearchQuery(searchParams.get("search") || "", 200)
  const statusParam = searchParams.get("status") || "active"
  const status = statusParam === "deleted" || statusParam === "all" ? statusParam : "active"

  const columnFilters: Record<string, string> = {}
  searchParams.forEach((value, key) => {
    if (key.startsWith("filter[")) {
      const columnKey = key.replace("filter[", "").replace("]", "")
      const sanitizedValue = sanitizeSearchQuery(value, 100)
      if (sanitizedValue.valid && sanitizedValue.value) {
        columnFilters[columnKey] = sanitizedValue.value
      }
    }
  })

  const result = await listCategoriesCached({
    page: paginationValidation.page,
    limit: paginationValidation.limit,
    search: searchValidation.value || undefined,
    filters: Object.keys(columnFilters).length > 0 ? columnFilters : undefined,
    status,
  })

  // Serialize result to match CategoriesResponse format
  const serialized = serializeCategoriesList(result)
  return NextResponse.json({
    data: serialized.rows,
    pagination: {
      page: serialized.page,
      limit: serialized.limit,
      total: serialized.total,
      totalPages: serialized.totalPages,
    },
  })
}

async function postCategoriesHandler(req: NextRequest, context: ApiRouteContext) {
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
    const category = await createCategory(ctx, body)
    // Serialize category to client format (dates to strings)
    const serialized = {
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      createdAt: category.createdAt.toISOString(),
      deletedAt: category.deletedAt ? category.deletedAt.toISOString() : null,
    }
    return NextResponse.json({ data: serialized }, { status: 201 })
  } catch (error) {
    if (error instanceof ApplicationError) {
      return NextResponse.json({ error: error.message || "Không thể tạo danh mục" }, { status: error.status || 400 })
    }
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message || "Không tìm thấy" }, { status: 404 })
    }
    console.error("Error creating category:", error)
    return NextResponse.json({ error: "Đã xảy ra lỗi khi tạo danh mục" }, { status: 500 })
  }
}

export const GET = createGetRoute(getCategoriesHandler)
export const POST = createPostRoute(postCategoriesHandler)

