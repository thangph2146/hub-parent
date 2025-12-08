import { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { listProducts } from "@/features/admin/products/server/queries"
import { serializeProductsList } from "@/features/admin/products/server/helpers"
import { getTablePermissionsAsync, getAuthInfo } from "@/features/admin/resources/server"
import { createErrorResponse, createSuccessResponse } from "@/lib/config"
import { PERMISSIONS } from "@/lib/permissions"

/**
 * GET /api/admin/products
 * List products với pagination, search, filters
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return createErrorResponse("Unauthorized", { status: 401 })
    }

    const permissions = await getTablePermissionsAsync({
      delete: [PERMISSIONS.PRODUCTS_DELETE],
      restore: [PERMISSIONS.PRODUCTS_UPDATE],
      manage: PERMISSIONS.PRODUCTS_MANAGE,
      create: PERMISSIONS.PRODUCTS_CREATE,
    })
    if (!permissions.canManage) {
      return createErrorResponse("Forbidden", { status: 403 })
    }

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

    const result = await listProducts({
      page,
      limit,
      search,
      status,
      filters: Object.keys(filters).length > 0 ? filters : undefined,
    })

    const serialized = serializeProductsList(result)

    return createSuccessResponse({
      data: serialized.rows,
      pagination: {
        page: result.pagination.page,
        limit: result.pagination.limit,
        total: result.pagination.total,
        totalPages: result.pagination.totalPages,
      },
    })
  } catch (error) {
    console.error("[GET /api/admin/products] Error:", error)
    const errorMessage = error instanceof Error ? error.message : "Không thể tải danh sách sản phẩm"
    return createErrorResponse(errorMessage, { status: 500 })
  }
}

/**
 * POST /api/admin/products
 * Create new product
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return createErrorResponse("Unauthorized", { status: 401 })
    }

    const permissions = await getTablePermissionsAsync({
      delete: [PERMISSIONS.PRODUCTS_DELETE],
      restore: [PERMISSIONS.PRODUCTS_UPDATE],
      manage: PERMISSIONS.PRODUCTS_MANAGE,
      create: PERMISSIONS.PRODUCTS_CREATE,
    })
    if (!permissions.canCreate) {
      return createErrorResponse("Forbidden", { status: 403 })
    }

    const body = await request.json()
    const { createProduct } = await import("@/features/admin/products/server/mutations")
    const authInfo = await getAuthInfo()
    const ctx = {
      actorId: authInfo.actorId || session.user.id,
      permissions: authInfo.permissions,
      roles: authInfo.roles,
    }

    const product = await createProduct(ctx, body)

    return createSuccessResponse(product, { status: 201 })
  } catch (error: unknown) {
    console.error("[POST /api/admin/products] Error:", error)
    const errorMessage = error instanceof Error ? error.message : "Không thể tạo sản phẩm"
    const status = error && typeof error === "object" && "statusCode" in error && typeof error.statusCode === "number" ? error.statusCode : 500
    return createErrorResponse(errorMessage, { status })
  }
}

