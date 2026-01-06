/**
 * API Route: POST /api/admin/users/bulk
 * Body: { action: "delete" | "restore" | "hard-delete", ids: string[] }
 */
import { NextRequest } from "next/server"
import {
  type AuthContext,
  bulkSoftDeleteUsers,
  bulkRestoreUsers,
  bulkHardDeleteUsers,
} from "@/features/admin/users/server/mutations"
import { PERMISSIONS } from "@/lib/permissions"
import { createPostRoute } from "@/lib/api/api-route-wrapper"
import type { ApiRouteContext } from "@/lib/api/types"
import { createErrorResponse, createSuccessResponse } from "@/lib/config"
import { validateArray, validateEnum, validateID } from "@/lib/api/validation"
import { parseRequestBody, createAuthContext, handleApiError } from "@/lib/api/api-route-helpers"

type BulkAction = "delete" | "restore" | "hard-delete"

async function bulkUsersHandler(req: NextRequest, context: ApiRouteContext) {
  try {
    const body = await parseRequestBody(req)

    const { action, ids } = body as { action?: BulkAction; ids?: unknown }

    const actionValidation = validateEnum(action, ["delete", "restore", "hard-delete"] as const, "Action")
    if (!actionValidation.valid) {
      return createErrorResponse(actionValidation.error, { status: 400 })
    }

    const idsValidation = validateArray<string>(ids, 1, 100, "Danh sách người dùng")
    if (!idsValidation.valid || !idsValidation.value) {
      return createErrorResponse(
        idsValidation.error || "Danh sách người dùng phải có ít nhất 1 phần tử và tối đa 100 phần tử",
        { status: 400 }
      )
    }

    for (const id of idsValidation.value) {
      const idValidation = validateID(id)
      if (!idValidation.valid) {
        return createErrorResponse(`ID không hợp lệ: ${id}`, { status: 400 })
      }
    }

    const userId = context.session.user?.id ?? "unknown"
    const ctx = createAuthContext(context, userId) as AuthContext

    const actions: Record<BulkAction, typeof bulkSoftDeleteUsers> = {
      delete: bulkSoftDeleteUsers,
      restore: bulkRestoreUsers,
      "hard-delete": bulkHardDeleteUsers,
    }

    const result = await actions[actionValidation.value!](ctx, idsValidation.value!)
    return createSuccessResponse({
      affected: result.affected,
      message: result.message,
    })
  } catch (error) {
    return handleApiError(error, "Đã xảy ra lỗi khi thực hiện thao tác hàng loạt", 500)
  }
}

export const POST = createPostRoute(bulkUsersHandler, {
  permissions: [PERMISSIONS.USERS_DELETE, PERMISSIONS.USERS_UPDATE, PERMISSIONS.USERS_MANAGE],
  autoDetectPermissions: false,
})
