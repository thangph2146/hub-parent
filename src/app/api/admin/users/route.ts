/**
 * API Route: GET /api/admin/users - List users
 * POST /api/admin/users - Create user
 */
import { NextRequest } from "next/server"
import { listUsers } from "@/features/admin/users/server/queries"
import { serializeUsersList } from "@/features/admin/users/server/helpers"
import {
  createUser,
  type AuthContext,
} from "@/features/admin/users/server/mutations"
import { createUserSchema } from "@/features/admin/users/server/validation"
import { createGetRoute, createPostRoute } from "@/lib"
import type { ApiRouteContext } from "@/types"
import { validatePagination, sanitizeSearchQuery, parseColumnFilters, filtersOrUndefined } from "@/utils"
import { parseRequestBody, createAuthContext, handleApiError } from "@/lib"
import { createSuccessResponse, createErrorResponse } from "@/lib"

async function getUsersHandler(req: NextRequest, _context: ApiRouteContext) {
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
  const result = await listUsers({
    page: paginationValidation.page,
    limit: paginationValidation.limit,
    search: searchValidation.value || undefined,
    filters: filtersOrUndefined(columnFilters),
    status,
  })

  const serialized = serializeUsersList(result)
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

async function postUsersHandler(req: NextRequest, context: ApiRouteContext) {
  try {
    const body = await parseRequestBody(req)
    const userId = context.session.user?.id ?? "unknown"
    const ctx = createAuthContext(context, userId) as AuthContext

    const validationResult = createUserSchema.safeParse(body)
    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0]
      return createErrorResponse(firstError?.message || "Dữ liệu không hợp lệ", { status: 400 })
    }

    const user = await createUser(ctx, validationResult.data)
    return createSuccessResponse(user, { status: 201 })
  } catch (error) {
    return handleApiError(error, "Đã xảy ra lỗi khi tạo người dùng", 500)
  }
}

export const GET = createGetRoute(getUsersHandler)
export const POST = createPostRoute(postUsersHandler)
