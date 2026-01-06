/**
 * API Route: GET /api/admin/contact-requests - List contact requests
 */
import { NextRequest } from "next/server"
import { listContactRequests } from "@/features/admin/contact-requests/server/queries"
import { serializeContactRequestsList } from "@/features/admin/contact-requests/server/helpers"
import { createGetRoute } from "@/lib/api/api-route-wrapper"
import type { ApiRouteContext } from "@/lib/api/types"
import { validatePagination, sanitizeSearchQuery, parseColumnFilters, filtersOrUndefined } from "@/lib/api/validation"
import { createSuccessResponse, createErrorResponse } from "@/lib/config"

async function getContactRequestsHandler(req: NextRequest, _context: ApiRouteContext) {
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
  const status = statusParam === "deleted" || statusParam === "all" || statusParam === "NEW" || statusParam === "IN_PROGRESS" || statusParam === "RESOLVED" || statusParam === "CLOSED" ? statusParam : "active"

  const columnFilters = parseColumnFilters(searchParams, Infinity)

  // Sử dụng listContactRequests (non-cached) để đảm bảo data luôn fresh
  // API routes cần fresh data, không nên sử dụng cache để tránh trả về dữ liệu cũ
  const result = await listContactRequests({
    page: paginationValidation.page,
    limit: paginationValidation.limit,
    search: searchValidation.value || undefined,
    filters: filtersOrUndefined(columnFilters),
    status,
  })

  // Serialize result to match ContactRequestsResponse format
  const serialized = serializeContactRequestsList(result)
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

export const GET = createGetRoute(getContactRequestsHandler)

