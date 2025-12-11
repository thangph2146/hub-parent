import { NextRequest } from "next/server"
import { listProducts } from "@/features/admin/products/server/queries"
import { serializeProductsList } from "@/features/admin/products/server/helpers"
import { createErrorResponse } from "@/lib/config"
import { PERMISSIONS } from "@/lib/permissions"
import { handleListRequest } from "@/lib/api/crud-helpers"

/**
 * GET /api/admin/products
 * List products với pagination, search, filters
 */
export async function GET(request: NextRequest) {
  try {
    return await handleListRequest(
      request,
      {
        delete: [PERMISSIONS.PRODUCTS_DELETE],
        restore: [PERMISSIONS.PRODUCTS_UPDATE],
        manage: PERMISSIONS.PRODUCTS_MANAGE,
        create: PERMISSIONS.PRODUCTS_CREATE,
      },
      listProducts,
      serializeProductsList
    )
  } catch {
    return createErrorResponse("Không thể tải danh sách sản phẩm", { status: 500 })
  }
}

/**
 * POST /api/admin/products
 * Create new product
 */
export async function POST(request: NextRequest) {
  try {
    const { handleMutationRequest } = await import("@/lib/api/crud-helpers")
    const { createProduct } = await import("@/features/admin/products/server/mutations")
    const { createProductSchema } = await import("@/features/admin/products/server/schemas")

    return await handleMutationRequest(
      request,
      {
        delete: [PERMISSIONS.PRODUCTS_DELETE],
        restore: [PERMISSIONS.PRODUCTS_UPDATE],
        manage: PERMISSIONS.PRODUCTS_MANAGE,
        create: PERMISSIONS.PRODUCTS_CREATE,
      },
      createProduct,
      {
        requireCreate: true,
        parseBody: (body) => createProductSchema.parse(body),
        successStatus: 201,
      }
    )
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Không thể tạo sản phẩm"
    const status = error && typeof error === "object" && "statusCode" in error && typeof error.statusCode === "number" ? error.statusCode : 500
    return createErrorResponse(errorMessage, { status })
  }
}

