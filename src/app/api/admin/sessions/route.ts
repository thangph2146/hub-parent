/**
 * API Route: GET /api/admin/sessions - List sessions
 * POST /api/admin/sessions - Create session
 */
import { NextRequest } from "next/server"
import { listSessions } from "@/features/admin/sessions/server/queries"
import { serializeSessionsList } from "@/features/admin/sessions/server/helpers"
import {
  createSession,
  type AuthContext,
} from "@/features/admin/sessions/server/mutations"
import { CreateSessionSchema } from "@/features/admin/sessions/server/schemas"
import { createGetRoute, createPostRoute } from "@/lib/api/api-route-wrapper"
import type { ApiRouteContext } from "@/lib/api/types"
import { validatePagination, sanitizeSearchQuery, parseColumnFilters, filtersOrUndefined } from "@/lib/api/validation"
import { parseRequestBody, createAuthContext, handleApiError } from "@/lib/api/api-route-helpers"
import { createErrorResponse, createSuccessResponse } from "@/lib/config"

async function getSessionsHandler(req: NextRequest, _context: ApiRouteContext) {
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

  // Sử dụng listSessions (non-cached) để đảm bảo data luôn fresh
  // API routes cần fresh data, không nên sử dụng cache để tránh trả về dữ liệu cũ
  const result = await listSessions({
    page: paginationValidation.page,
    limit: paginationValidation.limit,
    search: searchValidation.value || undefined,
    filters: filtersOrUndefined(columnFilters),
    status,
  })

  // Serialize result to match SessionsResponse format
  const serialized = serializeSessionsList(result)
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

async function postSessionsHandler(req: NextRequest, context: ApiRouteContext) {
  try {
    const body = await parseRequestBody(req)

    // Validate body với Zod schema
    const validationResult = CreateSessionSchema.safeParse(body)
    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0]
      return createErrorResponse(firstError?.message || "Dữ liệu không hợp lệ", { status: 400 })
    }

    const userId = context.session.user?.id ?? "unknown"
    const ctx = createAuthContext(context, userId) as AuthContext

    const session = await createSession(ctx, validationResult.data)
    // Serialize session to client format (dates to strings)
    const serialized = {
      id: session.id,
      userId: session.userId,
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      userAgent: session.userAgent,
      ipAddress: session.ipAddress,
      isActive: session.isActive,
      expiresAt: session.expiresAt,
      lastActivity: session.lastActivity,
      createdAt: session.createdAt,
      deletedAt: session.deletedAt,
    }
    return createSuccessResponse(serialized, { status: 201 })
  } catch (error) {
    return handleApiError(error, "Đã xảy ra lỗi khi tạo session", 500)
  }
}

export const GET = createGetRoute(getSessionsHandler)
export const POST = createPostRoute(postSessionsHandler)

