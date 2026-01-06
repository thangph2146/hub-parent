/**
 * API Route: GET /api/admin/roles/[id], PUT /api/admin/roles/[id], DELETE /api/admin/roles/[id]
 */
import { NextRequest } from "next/server"
import { getRoleById } from "@/features/admin/roles/server/queries"
import { serializeRoleDetail } from "@/features/admin/roles/server/helpers"
import {
  type AuthContext,
  updateRole,
  softDeleteRole,
} from "@/features/admin/roles/server/mutations"
import { createGetRoute, createPutRoute, createDeleteRoute } from "@/lib/api/api-route-wrapper"
import type { ApiRouteContext } from "@/lib/api/types"
import { validateID } from "@/lib/api/validation"
import { extractParams, parseRequestBody, createAuthContext, handleApiError } from "@/lib/api/api-route-helpers"
import { createSuccessResponse, createErrorResponse } from "@/lib/config"

async function getRoleHandler(_req: NextRequest, _context: ApiRouteContext, ...args: unknown[]) {
  const { id } = await extractParams<{ id: string }>(args)

  const idValidation = validateID(id)
  if (!idValidation.valid) {
    return createErrorResponse(idValidation.error || "ID không hợp lệ", { status: 400 })
  }

  // Sử dụng getRoleById (non-cached) để đảm bảo data luôn fresh
  // Theo chuẩn Next.js 16: không cache admin data trong API routes
  const role = await getRoleById(id)
  if (!role || role.deletedAt) {
    return createErrorResponse(role ? "Vai trò đã bị xóa" : "Không tìm thấy vai trò", { status: 404 })
  }

  return createSuccessResponse(serializeRoleDetail(role))
}

async function putRoleHandler(req: NextRequest, context: ApiRouteContext, ...args: unknown[]) {
  try {
    const { id } = await extractParams<{ id: string }>(args)

    const idValidation = validateID(id)
    if (!idValidation.valid) {
      return createErrorResponse(idValidation.error || "ID không hợp lệ", { status: 400 })
    }

    const payload = await parseRequestBody(req)

    const userId = context.session.user?.id ?? "unknown"
    const ctx = createAuthContext(context, userId) as AuthContext

    const updated = await updateRole(ctx, id, payload)
    return createSuccessResponse(updated)
  } catch (error) {
    return handleApiError(error, "Đã xảy ra lỗi khi cập nhật vai trò", 500)
  }
}

async function deleteRoleHandler(_req: NextRequest, context: ApiRouteContext, ...args: unknown[]) {
  try {
    const { id } = await extractParams<{ id: string }>(args)

    const idValidation = validateID(id)
    if (!idValidation.valid) {
      return createErrorResponse(idValidation.error || "ID không hợp lệ", { status: 400 })
    }

    const userId = context.session.user?.id ?? "unknown"
    const ctx = createAuthContext(context, userId) as AuthContext

    await softDeleteRole(ctx, id)
    return createSuccessResponse({ message: "Vai trò đã được xóa thành công" })
  } catch (error) {
    return handleApiError(error, "Đã xảy ra lỗi khi xóa vai trò", 500)
  }
}

export const GET = createGetRoute(getRoleHandler)
export const PUT = createPutRoute(putRoleHandler)
export const DELETE = createDeleteRoute(deleteRoleHandler)

