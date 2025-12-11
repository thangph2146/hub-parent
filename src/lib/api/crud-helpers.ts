/**
 * Shared CRUD API Route Helpers
 * Giảm code duplication trong API routes
 */

import { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { getTablePermissionsAsync, getAuthInfo } from "@/features/admin/resources/server"
import { createErrorResponse, createSuccessResponse } from "@/lib/config"
import type { Permission } from "@/lib/permissions"

/**
 * Parse query parameters từ request
 */
export function parseListParams(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const page = parseInt(searchParams.get("page") || "1", 10)
  const limit = parseInt(searchParams.get("limit") || "10", 10)
  const search = searchParams.get("search") || undefined
  const status = (searchParams.get("status") || "active") as "active" | "deleted" | "all"

  // Parse filters
  const filters: Record<string, string> = {}
  searchParams.forEach((value, key) => {
    if (key.startsWith("filter[")) {
      const filterKey = key.slice(7, -1) // Remove "filter[" and "]"
      filters[filterKey] = value
    }
  })

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
export async function requireAuthAndPermissions(permissions: {
  delete?: Permission[]
  restore?: Permission[]
  manage: Permission
  create?: Permission
}) {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: createErrorResponse("Unauthorized", { status: 401 }) }
  }

  const tablePermissions = await getTablePermissionsAsync({
    delete: permissions.delete || [],
    restore: permissions.restore || [],
    manage: permissions.manage,
    create: permissions.create || permissions.manage, // Fallback to manage if create not provided
  })
  if (!tablePermissions.canManage) {
    return { error: createErrorResponse("Forbidden", { status: 403 }) }
  }

  return { session, permissions: tablePermissions }
}

/**
 * Create auth context for mutations
 */
export async function createMutationContext(session: { user: { id: string } }) {
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
export async function handleListRequest<T>(
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
) {
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
export async function handleDetailRequest<T>(
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
) {
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
export async function handleMutationRequest<TInput, TOutput>(
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
) {
  const { requireCreate = false, requireManage = false, requireDelete = false, parseBody, successStatus = 200 } = options || {}
  
  const authResult = await requireAuthAndPermissions(permissions)
  if (authResult.error) return authResult.error

  const { session, permissions: tablePermissions } = authResult

  // Check specific permission requirements
  if (requireCreate && !tablePermissions.canCreate) {
    return createErrorResponse("Forbidden", { status: 403 })
  }
  if (requireManage && !tablePermissions.canManage) {
    return createErrorResponse("Forbidden", { status: 403 })
  }
  if (requireDelete && !tablePermissions.canDelete) {
    return createErrorResponse("Forbidden", { status: 403 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return createErrorResponse("Dữ liệu không hợp lệ", { status: 400 })
  }

  const ctx = await createMutationContext(session)
  
  // Type-safe body parsing
  let input: TInput
  if (parseBody) {
    input = parseBody(body)
  } else {
    // Runtime type check for safety
    if (typeof body !== "object" || body === null) {
      return createErrorResponse("Dữ liệu không hợp lệ: body phải là object", { status: 400 })
    }
    input = body as TInput
  }
  
  const result = await mutationFn(ctx, input)

  return createSuccessResponse(result, { status: successStatus })
}

