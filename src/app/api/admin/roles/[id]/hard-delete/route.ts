/**
 * API Route: DELETE /api/admin/roles/[id]/hard-delete - Hard delete role (xóa vĩnh viễn)
 */
import { NextRequest } from "next/server"
import { type AuthContext, hardDeleteRole } from "@/features/admin/roles/server/mutations"
import { createDeleteRoute } from "@/lib"
import type { ApiRouteContext } from "@/types"
import { validateID } from "@/utils"
import { extractParams, createAuthContext, handleApiError } from "@/lib"
import { createSuccessResponse, createErrorResponse } from "@/lib"

async function hardDeleteRoleHandler(_req: NextRequest, context: ApiRouteContext, ...args: unknown[]) {
  try {
    const { id } = await extractParams<{ id: string }>(args)

    const idValidation = validateID(id)
    if (!idValidation.valid) {
      return createErrorResponse(idValidation.error || "Role ID không hợp lệ", { status: 400 })
    }

    const userId = context.session.user?.id ?? "unknown"
    const ctx = createAuthContext(context, userId) as AuthContext

    await hardDeleteRole(ctx, id)
    return createSuccessResponse({ message: "Role permanently deleted" })
  } catch (error) {
    return handleApiError(error, "Đã xảy ra lỗi khi xóa vĩnh viễn vai trò", 500)
  }
}

export const DELETE = createDeleteRoute(hardDeleteRoleHandler)

