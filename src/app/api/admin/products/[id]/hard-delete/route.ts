import { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { getTablePermissionsAsync, getAuthInfo } from "@/features/admin/resources/server"
import { createErrorResponse, createSuccessResponse } from "@/lib/config"
import { PERMISSIONS } from "@/lib/permissions"

/**
 * DELETE /api/admin/products/[id]/hard-delete
 * Hard delete product (permanent)
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
    if (!permissions.canManage) {
      return createErrorResponse("Forbidden", { status: 403 })
    }

    const { id } = await params
    const { hardDeleteProduct } = await import("@/features/admin/products/server/mutations")
    const authInfo = await getAuthInfo()
    const ctx = {
      actorId: authInfo.actorId || session.user.id,
      permissions: authInfo.permissions,
      roles: authInfo.roles,
    }

    await hardDeleteProduct(ctx, id)

    return createSuccessResponse({ success: true })
  } catch (error: unknown) {
    console.error("[DELETE /api/admin/products/[id]/hard-delete] Error:", error)
    const errorMessage = error instanceof Error ? error.message : "Không thể xóa vĩnh viễn sản phẩm"
    const status = error && typeof error === "object" && "statusCode" in error && typeof error.statusCode === "number" ? error.statusCode : 500
    return createErrorResponse(errorMessage, { status })
  }
}

