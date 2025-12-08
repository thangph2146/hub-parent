import { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { getTablePermissionsAsync } from "@/features/admin/resources/server"
import { createErrorResponse, createSuccessResponse } from "@/lib/config"
import { PERMISSIONS } from "@/lib/permissions"
import { prisma } from "@/lib/database"

/**
 * GET /api/admin/products/options
 * Get column options for filtering
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
    const column = searchParams.get("column")
    const search = searchParams.get("search") || undefined
    const limit = parseInt(searchParams.get("limit") || "50", 10)

    if (!column) {
      return createErrorResponse("Column parameter is required", { status: 400 })
    }

    // Get options based on column
    let options: Array<{ label: string; value: string }> = []

    switch (column) {
      case "status":
        options = [
          { label: "Đang bán", value: "ACTIVE" },
          { label: "Nháp", value: "DRAFT" },
          { label: "Ngừng bán", value: "INACTIVE" },
          { label: "Lưu trữ", value: "ARCHIVED" },
        ]
        break
      case "featured":
        options = [
          { label: "Có", value: "true" },
          { label: "Không", value: "false" },
        ]
        break
      case "name":
      case "sku":
      case "slug":
        const where: Record<string, unknown> = {
          deletedAt: null,
        }
        if (search) {
          where[column] = {
            contains: search,
            mode: "insensitive",
          }
        }
        const products = await prisma.product.findMany({
          where,
          take: limit,
          select: {
            [column]: true,
          },
          distinct: [column],
        })
        options = products.map((p: Record<string, unknown>) => ({
          label: String(p[column] || ""),
          value: String(p[column] || ""),
        }))
        break
      default:
        return createErrorResponse(`Column ${column} is not supported`, { status: 400 })
    }

    return createSuccessResponse(options)
  } catch (error) {
    console.error("[GET /api/admin/products/options] Error:", error)
    const errorMessage = error instanceof Error ? error.message : "Không thể tải options"
    return createErrorResponse(errorMessage, { status: 500 })
  }
}

