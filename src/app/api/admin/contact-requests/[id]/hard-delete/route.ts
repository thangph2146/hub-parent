/**
 * API Route: DELETE /api/admin/contact-requests/[id]/hard-delete - Hard delete contact request
 */
import { NextRequest } from "next/server"
import {
  hardDeleteContactRequest,
  type AuthContext,
} from "@/features/admin/contact-requests/server/mutations"
import { createDeleteRoute } from "@/lib/api/api-route-wrapper"
import type { ApiRouteContext } from "@/lib/api/types"
import { validateID } from "@/lib/api/validation"
import { extractParams, createAuthContext, handleApiError } from "@/lib/api/api-route-helpers"
import { createSuccessResponse, createErrorResponse } from "@/lib/config"

async function hardDeleteContactRequestHandler(_req: NextRequest, context: ApiRouteContext, ...args: unknown[]) {
  try {
    const { id: contactRequestId } = await extractParams<{ id: string }>(args)

    const idValidation = validateID(contactRequestId)
    if (!idValidation.valid) {
      return createErrorResponse(idValidation.error || "Contact Request ID không hợp lệ", { status: 400 })
    }

    const userId = context.session.user?.id ?? "unknown"
    const ctx = createAuthContext(context, userId) as AuthContext

    await hardDeleteContactRequest(ctx, contactRequestId)
    return createSuccessResponse({ message: "Contact Request permanently deleted" })
  } catch (error) {
    return handleApiError(error, "Đã xảy ra lỗi khi xóa vĩnh viễn yêu cầu liên hệ", 500)
  }
}

export const DELETE = createDeleteRoute(hardDeleteContactRequestHandler)

