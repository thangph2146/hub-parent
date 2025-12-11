import { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { listOrders } from "@/features/admin/orders/server/queries"
import { serializeOrdersList } from "@/features/admin/orders/server/helpers"
import { getTablePermissionsAsync, getAuthInfo } from "@/features/admin/resources/server"
import { createErrorResponse, createSuccessResponse } from "@/lib/config"
import { PERMISSIONS } from "@/lib/permissions"
import { handleListRequest } from "@/lib/api/crud-helpers"

/**
 * GET /api/admin/orders
 * List orders với pagination, search, filters
 */
export async function GET(request: NextRequest) {
  try {
    return await handleListRequest(
      request,
      {
        delete: [PERMISSIONS.ORDERS_DELETE],
        restore: [PERMISSIONS.ORDERS_UPDATE],
        manage: PERMISSIONS.ORDERS_MANAGE,
        create: PERMISSIONS.ORDERS_CREATE,
      },
      listOrders,
      serializeOrdersList
    )
  } catch {
    return createErrorResponse("Không thể tải danh sách đơn hàng", { status: 500 })
  }
}

/**
 * POST /api/admin/orders
 * Create new order
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return createErrorResponse("Unauthorized", { status: 401 })
    }

    const permissions = await getTablePermissionsAsync({
      delete: [PERMISSIONS.ORDERS_DELETE],
      restore: [PERMISSIONS.ORDERS_UPDATE],
      manage: PERMISSIONS.ORDERS_MANAGE,
      create: PERMISSIONS.ORDERS_CREATE,
    })
    if (!permissions.canCreate) {
      return createErrorResponse("Forbidden", { status: 403 })
    }

    const body = await request.json()
    const { createOrder } = await import("@/features/admin/orders/server/mutations")
    const authInfo = await getAuthInfo()
    const ctx = {
      actorId: authInfo.actorId || session.user.id,
      permissions: authInfo.permissions,
      roles: authInfo.roles,
    }

    const order = await createOrder(ctx, body)

    return createSuccessResponse(order, { status: 201 })
  } catch (error: unknown) {
    console.error("[POST /api/admin/orders] Error:", error)
    const errorMessage = error instanceof Error ? error.message : "Không thể tạo đơn hàng"
    const status = error && typeof error === "object" && "statusCode" in error && typeof error.statusCode === "number" ? error.statusCode : 500
    return createErrorResponse(errorMessage, { status })
  }
}

