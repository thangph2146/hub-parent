/**
 * API Route: GET /api/admin/accounts - Get current user's account
 * PUT /api/admin/accounts - Update current user's account
 */
import { NextRequest } from "next/server"
import { getCurrentUserProfile } from "@/features/admin/accounts/server/queries"
import { updateCurrentUserAccount } from "@/features/admin/accounts/server/mutations"
import {
  type AuthContext,
} from "@/features/admin/resources/server"
import { createGetRoute, createPutRoute } from "@/lib"
import type { ApiRouteContext } from "@/types"
import type { UpdateAccountInput } from "@/features/admin/accounts/server/schemas"
import { parseRequestBody, createAuthContext, handleApiError } from "@/lib"
import { createSuccessResponse, createErrorResponse } from "@/lib"

async function getAccountHandler(_req: NextRequest, context: ApiRouteContext) {
  const userId = context.session.user?.id

  if (!userId) {
    return createErrorResponse("Bạn cần đăng nhập để xem thông tin tài khoản", { status: 401 })
  }

  // Sử dụng getCurrentUserProfile (non-cached) để đảm bảo data luôn fresh
  // Theo chuẩn Next.js 16: không cache admin data
  const account = await getCurrentUserProfile(userId)
  if (!account) {
    return createErrorResponse("Không tìm thấy tài khoản", { status: 404 })
  }

  return createSuccessResponse(account)
}

async function putAccountHandler(req: NextRequest, context: ApiRouteContext) {
  try {
    const userId = context.session.user?.id

    if (!userId) {
      return createErrorResponse("Bạn cần đăng nhập để cập nhật thông tin tài khoản", { status: 401 })
    }

    const payload = await parseRequestBody(req) as UpdateAccountInput

    // Chỉ cho phép cập nhật các trường được phép
    const allowedFields = ["name", "bio", "phone", "address", "password", "avatar"]
    const invalidFields = Object.keys(payload).filter((key) => !allowedFields.includes(key))

    if (invalidFields.length > 0) {
      return createErrorResponse(
        `Các trường không hợp lệ: ${invalidFields.join(", ")}`,
        { status: 400, data: { invalidFields } }
      )
    }

    const ctx = createAuthContext(context, userId) as AuthContext

    const updated = await updateCurrentUserAccount(ctx, payload)
    return createSuccessResponse(updated)
  } catch (error) {
    return handleApiError(error, "Đã xảy ra lỗi khi cập nhật tài khoản", 500)
  }
}

export const GET = createGetRoute(getAccountHandler)
export const PUT = createPutRoute(putAccountHandler)

