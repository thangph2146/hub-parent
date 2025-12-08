import { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { getProductById } from "@/features/admin/products/server/queries"
import { getTablePermissionsAsync, getAuthInfo } from "@/features/admin/resources/server"
import { createErrorResponse, createSuccessResponse } from "@/lib/config"
import { PERMISSIONS } from "@/lib/permissions"
import { logger } from "@/lib/config/logger"

/**
 * GET /api/admin/products/[id]
 * Get product by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params
    const product = await getProductById(id)
    if (!product) {
      return createErrorResponse("Sản phẩm không tồn tại", { status: 404 })
    }

    return createSuccessResponse(product)
  } catch (error) {
      logger.error("[GET /api/admin/products/[id]] Error:", { error })
    const errorMessage = error instanceof Error ? error.message : "Không thể tải sản phẩm"
    return createErrorResponse(errorMessage, { status: 500 })
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

    const { id } = await params
    let body: unknown
    try {
      body = await request.json()
    } catch (error) {
      logger.error("[PUT /api/admin/products/[id]] Invalid JSON:", { error })
      return createErrorResponse("Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.", { status: 400 })
    }

    const { updateProduct } = await import("@/features/admin/products/server/mutations")
    const { updateProductSchema } = await import("@/features/admin/products/server/validation")
    const authInfo = await getAuthInfo()
    const ctx = {
      actorId: authInfo.actorId || session.user.id,
      permissions: authInfo.permissions,
      roles: authInfo.roles,
    }

    // Validate and parse body
    const validatedBody = updateProductSchema.parse(body)
    const product = await updateProduct(ctx, id, validatedBody)

    return createSuccessResponse(product)
  } catch (error: unknown) {
    logger.error("[PUT /api/admin/products/[id]] Error:", { error })
    
    // Log chi tiết lỗi để debug
    if (error instanceof Error) {
      logger.error("[PUT /api/admin/products/[id]] Error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name,
      })
    }
    
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
    if (!permissions.canDelete) {
      return createErrorResponse("Forbidden", { status: 403 })
    }

    const { id } = await params
    const { deleteProduct } = await import("@/features/admin/products/server/mutations")
    const authInfo = await getAuthInfo()
    const ctx = {
      actorId: authInfo.actorId || session.user.id,
      permissions: authInfo.permissions,
      roles: authInfo.roles,
    }

    await deleteProduct(ctx, id)

    return createSuccessResponse({ success: true })
  } catch (error: unknown) {
    logger.error("[DELETE /api/admin/products/[id]] Error:", { error })
    const errorMessage = error instanceof Error ? error.message : "Không thể xóa sản phẩm"
    const status = error && typeof error === "object" && "statusCode" in error && typeof error.statusCode === "number" ? error.statusCode : 500
    return createErrorResponse(errorMessage, { status })
  }
}

