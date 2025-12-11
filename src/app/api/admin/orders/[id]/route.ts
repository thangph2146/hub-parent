import { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { getOrderById } from "@/features/admin/orders/server/queries"
import { getTablePermissionsAsync, getAuthInfo } from "@/features/admin/resources/server"
import { createErrorResponse, createSuccessResponse } from "@/lib/config"
import { PERMISSIONS } from "@/lib/permissions"
import { handleDetailRequest } from "@/lib/api/crud-helpers"

/**
 * GET /api/admin/orders/[id]
 * Get order by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    return await handleDetailRequest(
      request,
      id,
      {
        delete: [PERMISSIONS.ORDERS_DELETE],
        restore: [PERMISSIONS.ORDERS_UPDATE],
        manage: PERMISSIONS.ORDERS_MANAGE,
        create: PERMISSIONS.ORDERS_CREATE,
      },
      getOrderById,
      "Đơn hàng không tồn tại"
    )
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Không thể tải đơn hàng"
    return createErrorResponse(errorMessage, { status: 500 })
  }
}

/**
 * PUT /api/admin/orders/[id]
 * Update order
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    if (!permissions.canManage) {
      return createErrorResponse("Forbidden", { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const { updateOrder } = await import("@/features/admin/orders/server/mutations")
    const authInfo = await getAuthInfo()
    const ctx = {
      actorId: authInfo.actorId || session.user.id,
      permissions: authInfo.permissions,
      roles: authInfo.roles,
    }

    const order = await updateOrder(ctx, id, body)

    return createSuccessResponse(order)
  } catch (error: unknown) {
    console.error("[PUT /api/admin/orders/[id]] Error:", error)
    const errorMessage = error instanceof Error ? error.message : "Không thể cập nhật đơn hàng"
    const status = error && typeof error === "object" && "statusCode" in error && typeof error.statusCode === "number" ? error.statusCode : 500
    return createErrorResponse(errorMessage, { status })
  }
}

/**
 * DELETE /api/admin/orders/[id]
 * Soft delete order
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    if (!permissions.canDelete) {
      return createErrorResponse("Forbidden", { status: 403 })
    }

    const { id } = await params
    const { deleteOrder } = await import("@/features/admin/orders/server/mutations")
    const authInfo = await getAuthInfo()
    const ctx = {
      actorId: authInfo.actorId || session.user.id,
      permissions: authInfo.permissions,
      roles: authInfo.roles,
    }

    await deleteOrder(ctx, id)

    return createSuccessResponse({ success: true })
  } catch (error: unknown) {
    console.error("[DELETE /api/admin/orders/[id]] Error:", error)
    const errorMessage = error instanceof Error ? error.message : "Không thể xóa đơn hàng"
    const status = error && typeof error === "object" && "statusCode" in error && typeof error.statusCode === "number" ? error.statusCode : 500
    return createErrorResponse(errorMessage, { status })
  }
}

