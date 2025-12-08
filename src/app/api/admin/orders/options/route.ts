import { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { getTablePermissionsAsync } from "@/features/admin/resources/server"
import { createErrorResponse, createSuccessResponse } from "@/lib/config"
import { PERMISSIONS } from "@/lib/permissions"

/**
 * GET /api/admin/orders/options
 * Get column options for filtering
 */
export async function GET(request: NextRequest) {
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

    const searchParams = request.nextUrl.searchParams
    const column = searchParams.get("column")
    // const search = searchParams.get("search") || undefined
    // const limit = parseInt(searchParams.get("limit") || "50", 10)

    if (!column) {
      return createErrorResponse("Column parameter is required", { status: 400 })
    }

    // Get options based on column
    let options: Array<{ label: string; value: string }> = []

    switch (column) {
      case "status":
        options = [
          { label: "Chờ xử lý", value: "PENDING" },
          { label: "Đang xử lý", value: "PROCESSING" },
          { label: "Đã giao hàng", value: "SHIPPED" },
          { label: "Đã nhận hàng", value: "DELIVERED" },
          { label: "Đã hủy", value: "CANCELLED" },
        ]
        break
      case "paymentStatus":
        options = [
          { label: "Chờ thanh toán", value: "PENDING" },
          { label: "Đã thanh toán", value: "PAID" },
          { label: "Đã hoàn tiền", value: "REFUNDED" },
          { label: "Thanh toán thất bại", value: "FAILED" },
        ]
        break
      default:
        return createErrorResponse(`Column ${column} is not supported`, { status: 400 })
    }

    return createSuccessResponse(options)
  } catch (error) {
    console.error("[GET /api/admin/orders/options] Error:", error)
    const errorMessage = error instanceof Error ? error.message : "Không thể tải options"
    return createErrorResponse(errorMessage, { status: 500 })
  }
}

