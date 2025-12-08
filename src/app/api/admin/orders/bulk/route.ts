import { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { getTablePermissionsAsync, getAuthInfo } from "@/features/admin/resources/server"
import { createErrorResponse, createSuccessResponse } from "@/lib/config"
import { PERMISSIONS } from "@/lib/permissions"
import { z } from "zod"

const bulkActionSchema = z.object({
  action: z.enum(["delete", "restore", "hard-delete"]),
  ids: z.array(z.string()).min(1),
})

/**
 * POST /api/admin/orders/bulk
 * Bulk actions on orders
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
    if (!permissions.canManage) {
      return createErrorResponse("Forbidden", { status: 403 })
    }

    const body = await request.json()
    const validationResult = bulkActionSchema.safeParse(body)
    if (!validationResult.success) {
      return createErrorResponse("Dữ liệu không hợp lệ", { status: 400 })
    }

    const { action, ids } = validationResult.data
    const authInfo = await getAuthInfo()
    const ctx = {
      actorId: authInfo.actorId || session.user.id,
      permissions: authInfo.permissions,
      roles: authInfo.roles,
    }

    const results = []
    for (const id of ids) {
      try {
        if (action === "delete") {
          const { deleteOrder } = await import("@/features/admin/orders/server/mutations")
          await deleteOrder(ctx, id)
        } else if (action === "restore") {
          const { restoreOrder } = await import("@/features/admin/orders/server/mutations")
          await restoreOrder(ctx, id)
        } else if (action === "hard-delete") {
          const { hardDeleteOrder } = await import("@/features/admin/orders/server/mutations")
          await hardDeleteOrder(ctx, id)
        }
        results.push({ id, success: true })
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Lỗi không xác định"
        results.push({ id, success: false, error: errorMessage })
      }
    }

    const successCount = results.filter((r) => r.success).length
    const failCount = results.filter((r) => !r.success).length

    return createSuccessResponse({
      success: failCount === 0,
      results,
      summary: {
        total: ids.length,
        success: successCount,
        failed: failCount,
      },
    })
  } catch (error: unknown) {
    console.error("[POST /api/admin/orders/bulk] Error:", error)
    const errorMessage = error instanceof Error ? error.message : "Không thể thực hiện hành động hàng loạt"
    return createErrorResponse(errorMessage, { status: 500 })
  }
}

