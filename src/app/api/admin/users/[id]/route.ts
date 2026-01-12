/**
 * API Route: GET /api/admin/users/[id], PUT /api/admin/users/[id], DELETE /api/admin/users/[id]
 */
import { NextRequest } from "next/server"
import { getUserDetailById } from "@/features/admin/users/server/queries"
import {
  type AuthContext,
  updateUser,
  softDeleteUser,
} from "@/features/admin/users/server/mutations"
import { createGetRoute, createPutRoute, createDeleteRoute } from "@/lib"
import type { ApiRouteContext } from "@/types"
import { validateID } from "@/utils"
import { extractParams, parseRequestBody, createAuthContext, handleApiError } from "@/lib"
import { createSuccessResponse, createErrorResponse } from "@/lib"

async function getUserHandler(_req: NextRequest, _context: ApiRouteContext, ...args: unknown[]) {
  const { id } = await extractParams<{ id: string }>(args)

  const idValidation = validateID(id)
  if (!idValidation.valid) {
    return createErrorResponse(idValidation.error || "ID không hợp lệ", { status: 400 })
  }

  const user = await getUserDetailById(id)
  if (!user || user.deletedAt) {
    return createErrorResponse(user ? "Người dùng đã bị xóa" : "Không tìm thấy người dùng", { status: 404 })
  }

  return createSuccessResponse(user)
}

async function putUserHandler(req: NextRequest, context: ApiRouteContext, ...args: unknown[]) {
  try {
    const { id } = await extractParams<{ id: string }>(args)

    const idValidation = validateID(id)
    if (!idValidation.valid) {
      return createErrorResponse(idValidation.error || "ID không hợp lệ", { status: 400 })
    }

    const payload = await parseRequestBody(req)

    const allowedFields = ["email", "name", "password", "roleIds", "isActive", "bio", "phone", "address"]
    const invalidFields = Object.keys(payload).filter((key) => !allowedFields.includes(key))

    if (invalidFields.length > 0) {
      return createErrorResponse(`Các trường không hợp lệ: ${invalidFields.join(", ")}`, { 
        status: 400,
        data: { invalidFields }
      })
    }

    if (payload.email && typeof payload.email === "string" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
      return createErrorResponse("Email không hợp lệ", { status: 400 })
    }

    if (payload.password && typeof payload.password === "string" && payload.password.length < 6) {
      return createErrorResponse("Mật khẩu phải có ít nhất 6 ký tự", { status: 400 })
    }

    if (payload.roleIds !== undefined) {
      if (!Array.isArray(payload.roleIds)) {
        return createErrorResponse("roleIds phải là một mảng", { status: 400 })
      }
      const invalidRoleIds = payload.roleIds.filter((roleId: unknown) => typeof roleId !== "string" || roleId.trim() === "")
      if (invalidRoleIds.length > 0) {
        return createErrorResponse("Một số roleIds không hợp lệ", { status: 400 })
      }
    }

    const userId = context.session.user?.id ?? "unknown"
    const ctx = createAuthContext(context, userId) as AuthContext

    const updated = await updateUser(ctx, id, payload)
    return createSuccessResponse(updated)
  } catch (error) {
    return handleApiError(error, "Đã xảy ra lỗi khi cập nhật người dùng", 500)
  }
}

async function deleteUserHandler(_req: NextRequest, context: ApiRouteContext, ...args: unknown[]) {
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

    await softDeleteUser(ctx, id)
    return createSuccessResponse({ message: "Người dùng đã được xóa thành công" })
  } catch (error) {
    return handleApiError(error, "Đã xảy ra lỗi khi xóa người dùng", 500)
  }
}

export const GET = createGetRoute(getUserHandler)
export const PUT = createPutRoute(putUserHandler)
export const DELETE = createDeleteRoute(deleteUserHandler)
