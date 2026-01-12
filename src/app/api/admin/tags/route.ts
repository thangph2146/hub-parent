/**
 * API Route: GET /api/admin/tags - List tags
 * POST /api/admin/tags - Create tag
 */
import { NextRequest } from "next/server"
import { listTags } from "@/features/admin/tags/server/queries"
import { serializeTagsList } from "@/features/admin/tags/server/helpers"
import {
  createTag,
  type AuthContext,
} from "@/features/admin/tags/server/mutations"
import { CreateTagSchema } from "@/features/admin/tags/server/schemas"
import { createGetRoute, createPostRoute } from "@/lib"
import type { ApiRouteContext } from "@/types"
import { validatePagination, sanitizeSearchQuery, parseColumnFilters, filtersOrUndefined } from "@/utils"
import { parseRequestBody, createAuthContext, handleApiError } from "@/lib"
import { createSuccessResponse, createErrorResponse } from "@/lib"

async function getTagsHandler(req: NextRequest, _context: ApiRouteContext) {
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

  // Sử dụng listTags (non-cached) thay vì listTagsCached để đảm bảo data luôn fresh
  // API routes cần fresh data, không nên sử dụng cache để tránh trả về dữ liệu cũ
  const result = await listTags({
    page: paginationValidation.page,
    limit: paginationValidation.limit,
    search: searchValidation.value || undefined,
    filters: filtersOrUndefined(columnFilters),
    status,
  })

  // Serialize result to match TagsResponse format
  const serialized = serializeTagsList(result)
  return createSuccessResponse({
    data: serialized.rows,
    pagination: {
      page: serialized.page,
      limit: serialized.limit,
      total: serialized.total,
      totalPages: serialized.totalPages,
    },
  })
}

async function postTagsHandler(req: NextRequest, context: ApiRouteContext) {
  try {
    const body = await parseRequestBody(req)

    // Validate body với Zod schema
    const validationResult = CreateTagSchema.safeParse(body)
    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0]
      return createErrorResponse(firstError?.message || "Dữ liệu không hợp lệ", { status: 400 })
    }

    const userId = context.session.user?.id ?? "unknown"
    const ctx = createAuthContext(context, userId) as AuthContext

    const tag = await createTag(ctx, validationResult.data)
    // Serialize tag to client format (dates to strings)
    const serialized = {
      id: tag.id,
      name: tag.name,
      slug: tag.slug,
      createdAt: tag.createdAt.toISOString(),
      deletedAt: tag.deletedAt ? tag.deletedAt.toISOString() : null,
    }
    return createSuccessResponse(serialized, { status: 201 })
  } catch (error) {
    return handleApiError(error, "Đã xảy ra lỗi khi tạo thẻ tag", 500)
  }
}

export const GET = createGetRoute(getTagsHandler)
export const POST = createPostRoute(postTagsHandler)

