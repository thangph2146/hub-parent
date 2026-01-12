/**
 * API Route: GET /api/admin/roles - List roles
 * POST /api/admin/roles - Create role
 */
import { NextRequest } from "next/server"
import { listRoles } from "@/features/admin/roles/server/queries"
import { serializeRolesList } from "@/features/admin/roles/server/helpers"
import {
  createRole,
  type AuthContext,
} from "@/features/admin/roles/server/mutations"
import { CreateRoleSchema } from "@/features/admin/roles/server/schemas"
import { createGetRoute, createPostRoute } from "@/lib"
import type { ApiRouteContext } from "@/types"
import { validatePagination, sanitizeSearchQuery, parseColumnFilters, filtersOrUndefined } from "@/utils"
import { parseRequestBody, createAuthContext, handleApiError } from "@/lib"
import { createSuccessResponse, createErrorResponse } from "@/lib"

async function getRolesHandler(req: NextRequest, _context: ApiRouteContext) {
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

  // Sử dụng listRoles (non-cached) để đảm bảo data luôn fresh
  // API routes cần fresh data, không nên sử dụng cache để tránh trả về dữ liệu cũ
  const result = await listRoles({
    page: paginationValidation.page,
    limit: paginationValidation.limit,
    search: searchValidation.value || undefined,
    filters: filtersOrUndefined(columnFilters),
    status,
  })

  // Serialize result to match RolesResponse format
  const serialized = serializeRolesList(result)
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

async function postRolesHandler(req: NextRequest, context: ApiRouteContext) {
  try {
    const body = await parseRequestBody(req)

    // Validate body với Zod schema
    const validationResult = CreateRoleSchema.safeParse(body)
    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0]
      return createErrorResponse(firstError?.message || "Dữ liệu không hợp lệ", { status: 400 })
    }

    const userId = context.session.user?.id ?? "unknown"
    const ctx = createAuthContext(context, userId) as AuthContext

    const role = await createRole(ctx, validationResult.data)
    // Serialize role to client format (dates to strings)
    const serialized = {
      id: role.id,
      name: role.name,
      displayName: role.displayName,
      description: role.description,
      permissions: role.permissions,
      isActive: role.isActive,
      createdAt: role.createdAt.toISOString(),
      deletedAt: role.deletedAt ? role.deletedAt.toISOString() : null,
    }
    return createSuccessResponse(serialized, { status: 201 })
  } catch (error) {
    return handleApiError(error, "Đã xảy ra lỗi khi tạo vai trò", 500)
  }
}

export const GET = createGetRoute(getRolesHandler)
export const POST = createPostRoute(postRolesHandler)

