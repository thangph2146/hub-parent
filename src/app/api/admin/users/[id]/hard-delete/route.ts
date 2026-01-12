/**
 * API Route: DELETE /api/admin/users/[id]/hard-delete - Hard delete user (xóa vĩnh viễn)
 */
import { NextRequest } from "next/server"
import { type AuthContext, hardDeleteUser } from "@/features/admin/users/server/mutations"
import { createDeleteRoute } from "@/lib"
import type { ApiRouteContext } from "@/types"
import { validateID } from "@/utils"
import { extractParams, createAuthContext, handleApiError } from "@/lib"
import { createSuccessResponse, createErrorResponse } from "@/lib"

async function hardDeleteUserHandler(_req: NextRequest, context: ApiRouteContext, ...args: unknown[]) {
  try {
    const { id } = await extractParams<{ id: string }>(args)

    const idValidation = validateID(id)
    if (!idValidation.valid) {
      return createErrorResponse(idValidation.error || "ID không hợp lệ", { status: 400 })
    }

    if (context.session.user?.id === id) {
      return createErrorResponse("Cannot delete your own account", { status: 400 })
    }

    const userId = context.session.user?.id ?? "unknown"
    const ctx = createAuthContext(context, userId) as AuthContext

    await hardDeleteUser(ctx, id)
    return createSuccessResponse({ message: "User permanently deleted" })
  } catch (error) {
    return handleApiError(error, "Đã xảy ra lỗi khi xóa vĩnh viễn người dùng", 500)
  }
}

export const DELETE = createDeleteRoute(hardDeleteUserHandler)
