import { NextRequest } from "next/server"
import { getProductById } from "@/features/admin/products/server/queries"
import { createErrorResponse } from "@/lib/config"
import { PERMISSIONS } from "@/lib/permissions"
import { handleDetailRequest } from "@/lib/api/crud-helpers"

/**
 * GET /api/admin/products/[id]
 * Get product by ID
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
        delete: [PERMISSIONS.PRODUCTS_DELETE],
        restore: [PERMISSIONS.PRODUCTS_UPDATE],
        manage: PERMISSIONS.PRODUCTS_MANAGE,
        create: PERMISSIONS.PRODUCTS_CREATE,
      },
      getProductById,
      "Sản phẩm không tồn tại"
    )
  } catch {
    return createErrorResponse("Không thể tải sản phẩm", { status: 500 })
  }
}

/**
 * PUT /api/admin/products/[id]
 * Update product
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { handleMutationRequest } = await import("@/lib/api/crud-helpers")
    const { updateProduct } = await import("@/features/admin/products/server/mutations")
    const { updateProductSchema } = await import("@/features/admin/products/server/schemas")

    return await handleMutationRequest(
      request,
      {
        delete: [PERMISSIONS.PRODUCTS_DELETE],
        restore: [PERMISSIONS.PRODUCTS_UPDATE],
        manage: PERMISSIONS.PRODUCTS_MANAGE,
        create: PERMISSIONS.PRODUCTS_CREATE,
      },
      async (ctx, input) => {
        const validated = updateProductSchema.parse(input)
        return updateProduct(ctx, id, validated)
      },
      {
        requireManage: true,
      }
    )
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Không thể cập nhật sản phẩm"
    const status = error && typeof error === "object" && "statusCode" in error && typeof error.statusCode === "number" ? error.statusCode : 500
    return createErrorResponse(errorMessage, { status })
  }
}

/**
 * DELETE /api/admin/products/[id]
 * Soft delete product
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { handleMutationRequest } = await import("@/lib/api/crud-helpers")
    const { deleteProduct } = await import("@/features/admin/products/server/mutations")

    return await handleMutationRequest(
      request,
      {
        delete: [PERMISSIONS.PRODUCTS_DELETE],
        restore: [PERMISSIONS.PRODUCTS_UPDATE],
        manage: PERMISSIONS.PRODUCTS_MANAGE,
        create: PERMISSIONS.PRODUCTS_CREATE,
      },
      (ctx) => deleteProduct(ctx, id),
      {
        requireDelete: true,
        parseBody: () => ({}), // DELETE doesn't need body
      }
    )
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Không thể xóa sản phẩm"
    const status = error && typeof error === "object" && "statusCode" in error && typeof error.statusCode === "number" ? error.statusCode : 500
    return createErrorResponse(errorMessage, { status })
  }
}

