/**
 * API Route: POST /api/admin/sessions/[id]/restore - Restore session
 */
import { NextRequest } from "next/server"
import {
  restoreSession,
  type AuthContext,
} from "@/features/admin/sessions/server/mutations"
import { createPostRoute } from "@/lib/api/api-route-wrapper"
import type { ApiRouteContext } from "@/lib/api/types"
import { validateID } from "@/lib/api/validation"
import { extractParams, createAuthContext, handleApiError } from "@/lib/api/api-route-helpers"
import { createSuccessResponse, createErrorResponse } from "@/lib/config"

async function restoreSessionHandler(_req: NextRequest, context: ApiRouteContext, ...args: unknown[]) {
  try {
    const { id: sessionId } = await extractParams<{ id: string }>(args)

    const idValidation = validateID(sessionId)
    if (!idValidation.valid) {
      return createErrorResponse(idValidation.error || "Session ID không hợp lệ", { status: 400 })
    }

    const userId = context.session.user?.id ?? "unknown"
    const ctx = createAuthContext(context, userId) as AuthContext

    await restoreSession(ctx, sessionId)
    return createSuccessResponse({ message: "Session restored successfully" })
  } catch (error) {
    return handleApiError(error, "Đã xảy ra lỗi khi khôi phục session", 500)
  }
}

export const POST = createPostRoute(restoreSessionHandler)

