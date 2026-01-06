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
  ApplicationError,
} from "@/features/admin/users/server/mutations"
import { PERMISSIONS } from "@/lib/permissions"
import { createPostRoute } from "@/lib/api/api-route-wrapper"
import type { ApiRouteContext } from "@/lib/api/types"
import { createErrorResponse, createSuccessResponse } from "@/lib/config"
import { logger } from "@/lib/config/logger"
import { validateArray, validateEnum, validateID } from "@/lib/api/validation"

type BulkAction = "delete" | "restore" | "hard-delete"

async function bulkUsersHandler(req: NextRequest, context: ApiRouteContext) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return createErrorResponse("Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.", { status: 400 })
  }

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

  const ctx: AuthContext = {
    actorId: context.session.user?.id ?? "unknown",
    permissions: context.permissions,
    roles: context.roles,
  }

  const actions: Record<BulkAction, typeof bulkSoftDeleteUsers> = {
    delete: bulkSoftDeleteUsers,
    restore: bulkRestoreUsers,
    "hard-delete": bulkHardDeleteUsers,
  }

  try {
    const result = await actions[actionValidation.value!](ctx, idsValidation.value!)
    return createSuccessResponse({
      affected: result.affected,
      message: result.message,
    })
  } catch (error) {
    if (error instanceof ApplicationError) {
      return createErrorResponse(error.message || "Không thể thực hiện thao tác hàng loạt", { status: error.status || 400 })
    }
    logger.error("Error in bulk users operation", { error, action: actionValidation.value, ids: idsValidation.value })
    return createErrorResponse("Đã xảy ra lỗi khi thực hiện thao tác hàng loạt", { status: 500 })
  }
}

export const POST = createPostRoute(bulkUsersHandler, {
  permissions: [PERMISSIONS.USERS_DELETE, PERMISSIONS.USERS_UPDATE, PERMISSIONS.USERS_MANAGE],
  autoDetectPermissions: false,
})
