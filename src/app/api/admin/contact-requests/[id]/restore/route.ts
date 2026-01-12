/**
 * API Route: POST /api/admin/contact-requests/[id]/restore - Restore contact request
 */
import { NextRequest } from "next/server"
import {
  restoreContactRequest,
  type AuthContext,
} from "@/features/admin/contact-requests/server/mutations"
import { createPostRoute } from "@/lib"
import type { ApiRouteContext } from "@/types"
import { validateID } from "@/utils"
import { extractParams, createAuthContext, handleApiError } from "@/lib"
import { createSuccessResponse, createErrorResponse } from "@/lib"

async function restoreContactRequestHandler(_req: NextRequest, context: ApiRouteContext, ...args: unknown[]) {
  try {
    const { id: contactRequestId } = await extractParams<{ id: string }>(args)

    const idValidation = validateID(contactRequestId)
    if (!idValidation.valid) {
      return createErrorResponse(idValidation.error || "Contact Request ID không hợp lệ", { status: 400 })
    }

    const userId = context.session.user?.id ?? "unknown"
    const ctx = createAuthContext(context, userId) as AuthContext

    await restoreContactRequest(ctx, contactRequestId)
    return createSuccessResponse({ message: "Contact Request restored successfully" })
  } catch (error) {
    return handleApiError(error, "Đã xảy ra lỗi khi khôi phục yêu cầu liên hệ", 500)
  }
}

export const POST = createPostRoute(restoreContactRequestHandler)

