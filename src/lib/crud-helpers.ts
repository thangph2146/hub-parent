/**
 * Shared CRUD API Route Helpers
 * Giảm code duplication trong API routes
 */

import { NextRequest } from "next/server"
import { auth } from "@/auth"
import { getTablePermissionsAsync, getAuthInfo } from "@/features/admin/resources/server"
import { createErrorResponse, createSuccessResponse } from "./api-response"
import type { Permission } from "@/permissions"

/**
 * Parse query parameters từ request
 */
export const parseListParams = (request: NextRequest) => {
  const searchParams = request.nextUrl.searchParams
  const page = parseInt(searchParams.get("page") || "1", 10)
  const limit = parseInt(searchParams.get("limit") || "10", 10)
  const search = searchParams.get("search") || undefined
  const status = (searchParams.get("status") || "active") as "active" | "deleted" | "all"

  // Parse filters
  const filters = Object.fromEntries(
    Array.from(searchParams.entries())
      .filter(([key]) => key.startsWith("filter["))
      .map(([key, value]) => [key.slice(7, -1), value])
  )

  return {
    page,
    limit,
    search,
    status,
    filters: Object.keys(filters).length > 0 ? filters : undefined,
  }
}

/**
 * Check authentication và permissions
 */
export const requireAuthAndPermissions = async (permissions: {
  delete?: Permission[]
  restore?: Permission[]
  manage: Permission
  create?: Permission
}) => {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: createErrorResponse("Unauthorized", { status: 401 }) }
  }

  const tablePermissions = await getTablePermissionsAsync({
    delete: permissions.delete || [],
    restore: permissions.restore || [],
    manage: permissions.manage,
    create: permissions.create || permissions.manage,
  })
  if (!tablePermissions.canManage) {
    return { error: createErrorResponse("Forbidden", { status: 403 }) }
  }

  return { session, permissions: tablePermissions }
}

/**
 * Create auth context for mutations
 */
export const createMutationContext = async (session: { user: { id: string } }) => {
  const authInfo = await getAuthInfo()
  return {
    actorId: authInfo.actorId || session.user.id,
    permissions: authInfo.permissions,
    roles: authInfo.roles,
  }
}

/**
 * Generic list handler wrapper
 */
export const handleListRequest = async <T>(
  request: NextRequest,
  permissions: {
    delete?: Permission[]
    restore?: Permission[]
    manage: Permission
    create?: Permission
  },
  listFn: (params: ReturnType<typeof parseListParams>) => Promise<{
    data: T[]
    pagination: { page: number; limit: number; total: number; totalPages: number }
  }>,
  serializeFn: (result: Awaited<ReturnType<typeof listFn>>) => { rows: unknown[] }
) => {
  const authResult = await requireAuthAndPermissions(permissions)
  if (authResult.error) return authResult.error

  const params = parseListParams(request)
  const result = await listFn(params)
  const serialized = serializeFn(result)

  return createSuccessResponse({
    data: serialized.rows,
    pagination: result.pagination,
  })
}

/**
 * Generic detail handler wrapper
 */
export const handleDetailRequest = async <T>(
  request: NextRequest,
  id: string,
  permissions: {
    delete?: Permission[]
    restore?: Permission[]
    manage: Permission
    create?: Permission
  },
  getFn: (id: string) => Promise<T | null>,
  notFoundMessage = "Không tìm thấy"
) => {
  const authResult = await requireAuthAndPermissions(permissions)
  if (authResult.error) return authResult.error

  const item = await getFn(id)
  if (!item) {
    return createErrorResponse(notFoundMessage, { status: 404 })
  }

  return createSuccessResponse(item)
}

/**
 * Generic mutation handler wrapper (POST/PUT/DELETE)
 */
export const handleMutationRequest = async <TInput, TOutput>(
  request: NextRequest,
  permissions: {
    delete?: Permission[]
    restore?: Permission[]
    manage: Permission
    create?: Permission
  },
  mutationFn: (ctx: Awaited<ReturnType<typeof createMutationContext>>, input: TInput) => Promise<TOutput>,
  options?: {
    requireCreate?: boolean
    requireManage?: boolean
    requireDelete?: boolean
    parseBody?: (body: unknown) => TInput
    successStatus?: number
  }
) => {
  const { requireCreate = false, requireManage = false, requireDelete = false, parseBody, successStatus = 200 } = options || {}
  
  const authResult = await requireAuthAndPermissions(permissions)
  if (authResult.error) return authResult.error

  const { session, permissions: tablePermissions } = authResult

  // Check specific permission requirements
  if ((requireCreate && !tablePermissions.canCreate) ||
      (requireManage && !tablePermissions.canManage) ||
      (requireDelete && !tablePermissions.canDelete)) {
    return createErrorResponse("Forbidden", { status: 403 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return createErrorResponse("Dữ liệu không hợp lệ", { status: 400 })
  }

  const ctx = await createMutationContext(session)
  const input: TInput = parseBody ? parseBody(body) : (body as TInput)
  const result = await mutationFn(ctx, input)

  return createSuccessResponse(result, { status: successStatus })
}
