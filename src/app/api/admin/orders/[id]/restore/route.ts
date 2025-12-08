import { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { getTablePermissionsAsync, getAuthInfo } from "@/features/admin/resources/server"
import { createErrorResponse, createSuccessResponse } from "@/lib/config"
import { PERMISSIONS } from "@/lib/permissions"

/**
 * POST /api/admin/orders/[id]/restore
 * Restore deleted order
 */
export async function POST(
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
    const { restoreOrder } = await import("@/features/admin/orders/server/mutations")
    const authInfo = await getAuthInfo()
    const ctx = {
      actorId: authInfo.actorId || session.user.id,
      permissions: authInfo.permissions,
      roles: authInfo.roles,
    }

    await restoreOrder(ctx, id)

    return createSuccessResponse({ success: true })
  } catch (error: unknown) {
    console.error("[POST /api/admin/orders/[id]/restore] Error:", error)
    const errorMessage = error instanceof Error ? error.message : "Không thể khôi phục đơn hàng"
    const status = error && typeof error === "object" && "statusCode" in error && typeof error.statusCode === "number" ? error.statusCode : 500
    return createErrorResponse(errorMessage, { status })
  }
}

