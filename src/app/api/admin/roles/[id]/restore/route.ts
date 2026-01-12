/**
 * API Route: POST /api/admin/roles/[id]/restore
 */
import { NextRequest } from "next/server"
import { type AuthContext, restoreRole } from "@/features/admin/roles/server/mutations"
import { createPostRoute } from "@/lib"
import type { ApiRouteContext } from "@/types"
import { validateID } from "@/utils"
import { extractParams, createAuthContext, handleApiError } from "@/lib"
import { createSuccessResponse, createErrorResponse } from "@/lib"

async function restoreRoleHandler(_req: NextRequest, context: ApiRouteContext, ...args: unknown[]) {
  try {
    const { id } = await extractParams<{ id: string }>(args)

    const idValidation = validateID(id)
    if (!idValidation.valid) {
      return createErrorResponse(idValidation.error || "Role ID không hợp lệ", { status: 400 })
    }

    const userId = context.session.user?.id ?? "unknown"
    const ctx = createAuthContext(context, userId) as AuthContext

    await restoreRole(ctx, id)
    return createSuccessResponse({ message: "Role restored successfully" })
  } catch (error) {
    return handleApiError(error, "Đã xảy ra lỗi khi khôi phục vai trò", 500)
  }
}

export const POST = createPostRoute(restoreRoleHandler)

