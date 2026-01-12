/**
 * API Route: DELETE /api/admin/sessions/[id]/hard-delete - Hard delete session
 */
import { NextRequest } from "next/server"
import {
  hardDeleteSession,
  type AuthContext,
} from "@/features/admin/sessions/server/mutations"
import { createDeleteRoute } from "@/lib"
import type { ApiRouteContext } from "@/types"
import { validateID } from "@/utils"
import { extractParams, createAuthContext, handleApiError } from "@/lib"
import { createSuccessResponse, createErrorResponse } from "@/lib"

async function hardDeleteSessionHandler(_req: NextRequest, context: ApiRouteContext, ...args: unknown[]) {
  try {
    const { id: sessionId } = await extractParams<{ id: string }>(args)

    const idValidation = validateID(sessionId)
    if (!idValidation.valid) {
      return createErrorResponse(idValidation.error || "Session ID không hợp lệ", { status: 400 })
    }

    const userId = context.session.user?.id ?? "unknown"
    const ctx = createAuthContext(context, userId) as AuthContext

    await hardDeleteSession(ctx, sessionId)
    return createSuccessResponse({ message: "Session permanently deleted" })
  } catch (error) {
    return handleApiError(error, "Đã xảy ra lỗi khi xóa vĩnh viễn session", 500)
  }
}

export const DELETE = createDeleteRoute(hardDeleteSessionHandler)

