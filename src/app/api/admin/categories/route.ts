/**
 * API Route: GET /api/admin/categories - List categories
 * POST /api/admin/categories - Create category
 */
import { NextRequest } from "next/server"
import { listCategories } from "@/features/admin/categories/server/queries"
import { serializeCategoriesList } from "@/features/admin/categories/server/helpers"
import {
  createCategory,
  type AuthContext,
} from "@/features/admin/categories/server/mutations"
import { CreateCategorySchema } from "@/features/admin/categories/server/schemas"
import { createGetRoute, createPostRoute } from "@/lib/api/api-route-wrapper"
import type { ApiRouteContext } from "@/lib/api/types"
import { validatePagination, sanitizeSearchQuery, parseColumnFilters, filtersOrUndefined } from "@/lib/api/validation"
import { parseRequestBody, createAuthContext, handleApiError } from "@/lib/api/api-route-helpers"
import { createSuccessResponse, createErrorResponse } from "@/lib/config"
import { CategoriesResponse } from "@/features/admin/categories/types"

async function getCategoriesHandler(req: NextRequest, _context: ApiRouteContext) {
  const searchParams = req.nextUrl.searchParams

  const paginationValidation = validatePagination({
    page: searchParams.get("page"),
    limit: searchParams.get("limit"),
  })

  if (!paginationValidation.valid) {
    return createErrorResponse(paginationValidation.error || "Invalid pagination parameters", { status: 400 })
  }

  const searchValidation = sanitizeSearchQuery(searchParams.get("search") || "", 200)
  const statusParam = searchParams.get("status") || "active"
  const status = statusParam === "deleted" || statusParam === "all" ? statusParam : "active"

  const columnFilters = parseColumnFilters(searchParams, Infinity)
  const result = await listCategories({
    page: paginationValidation.page,
    limit: paginationValidation.limit,
    search: searchValidation.value || undefined,
    filters: filtersOrUndefined(columnFilters),
    status,
  })

  const serialized = serializeCategoriesList(result)
  return createSuccessResponse({
    data: serialized.rows,
    pagination: {
      page: serialized.page,
      limit: serialized.limit,
      total: serialized.total,
      totalPages: serialized.totalPages,
    },
  } as CategoriesResponse)
}

async function postCategoriesHandler(req: NextRequest, context: ApiRouteContext) {
  try {
    const body = await parseRequestBody(req)
    const userId = context.session.user?.id ?? "unknown"
    const ctx = createAuthContext(context, userId) as AuthContext

    const validationResult = CreateCategorySchema.safeParse(body)
    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0]
      return createErrorResponse(firstError?.message || "Dữ liệu không hợp lệ", { status: 400 })
    }

    const category = await createCategory(ctx, validationResult.data)
    const serialized = {
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      createdAt: category.createdAt.toISOString(),
      deletedAt: category.deletedAt ? category.deletedAt.toISOString() : null,
    }
    return createSuccessResponse(serialized, { status: 201 })
  } catch (error) {
    return handleApiError(error, "Đã xảy ra lỗi khi tạo danh mục", 500)
  }
}

export const GET = createGetRoute(getCategoriesHandler)
export const POST = createPostRoute(postCategoriesHandler)
