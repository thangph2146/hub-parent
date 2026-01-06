import { NextRequest } from "next/server"
import { listComments } from "@/features/admin/comments/server/queries"
import { serializeCommentsList } from "@/features/admin/comments/server/helpers"
import { createGetRoute } from "@/lib/api/api-route-wrapper"
import type { ApiRouteContext } from "@/lib/api/types"
import { validatePagination, sanitizeSearchQuery, parseColumnFilters, buildFilters, filtersOrUndefined } from "@/lib/api/validation"
import { createErrorResponse, createSuccessResponse } from "@/lib/config"
import type { ListCommentsInput } from "@/features/admin/comments/types"

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
  const status = (searchParams.get("status") || "active") as "active" | "deleted" | "all"
  const columnFilters = parseColumnFilters(searchParams)
  const filters = buildFilters<NonNullable<ListCommentsInput["filters"]>>(
    columnFilters,
    status === "deleted" || status === "all" ? status : "active",
    ["approved", "authorId", "authorName", "authorEmail", "postId", "postTitle"]
  )

  const result = await listComments({
    page: paginationValidation.page,
    limit: paginationValidation.limit,
    search: searchValidation.value || undefined,
    filters: filtersOrUndefined(filters),
  })

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
