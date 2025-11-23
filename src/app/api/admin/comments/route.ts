/**
 * API Route: GET /api/admin/comments - List comments
 */
import { NextRequest } from "next/server"
import { listComments } from "@/features/admin/comments/server/queries"
import { serializeCommentsList } from "@/features/admin/comments/server/helpers"
import { createGetRoute } from "@/lib/api/api-route-wrapper"
import type { ApiRouteContext } from "@/lib/api/types"
import { validatePagination, sanitizeSearchQuery } from "@/lib/api/validation"
import { createErrorResponse, createSuccessResponse } from "@/lib/config"

async function getCommentsHandler(req: NextRequest, _context: ApiRouteContext) {
  const searchParams = req.nextUrl.searchParams

  const paginationValidation = validatePagination({
    page: searchParams.get("page"),
    limit: searchParams.get("limit"),
  })

  if (!paginationValidation.valid) {
    return createErrorResponse(paginationValidation.error || "Invalid pagination params", { status: 400 })
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

  const filters: {
    approved?: boolean
    authorId?: string
    postId?: string
    deleted?: boolean
  } = {}

  if (status === "deleted") {
    filters.deleted = true
  } else if (status === "active") {
    filters.deleted = false
  }

  // Parse approved filter if provided
  if (columnFilters.approved) {
    filters.approved = columnFilters.approved === "true"
  }

  if (columnFilters.authorId) {
    filters.authorId = columnFilters.authorId
  }

  if (columnFilters.postId) {
    filters.postId = columnFilters.postId
  }

  const params = {
    page: paginationValidation.page,
    limit: paginationValidation.limit,
    search: searchValidation.value || undefined,
    filters: Object.keys(filters).length > 0 ? filters : undefined,
  }

  // Sử dụng listComments (non-cached) để đảm bảo data luôn fresh
  // API routes cần fresh data, không nên sử dụng cache để tránh trả về dữ liệu cũ
  const result = await listComments(params)

  // Serialize result to match CommentsResponse format
  const serialized = serializeCommentsList(result)
  
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

export const GET = createGetRoute(getCommentsHandler)
