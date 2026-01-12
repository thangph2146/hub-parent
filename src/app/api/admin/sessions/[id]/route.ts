/**
 * API Route: GET /api/admin/sessions/[id] - Get session
 * PUT /api/admin/sessions/[id] - Update session
 * DELETE /api/admin/sessions/[id] - Soft delete session
 */
import { NextRequest } from "next/server"
import { getSessionById } from "@/features/admin/sessions/server/queries"
import { serializeSessionDetail } from "@/features/admin/sessions/server/helpers"
import {
  updateSession,
  softDeleteSession,
  type AuthContext,
} from "@/features/admin/sessions/server/mutations"
import { UpdateSessionSchema } from "@/features/admin/sessions/server/schemas"
import { createGetRoute, createPutRoute, createDeleteRoute } from "@/lib"
import type { ApiRouteContext } from "@/types"
import { validateID } from "@/utils"
import { extractParams, parseRequestBody, createAuthContext, handleApiError } from "@/lib"
import { createSuccessResponse, createErrorResponse } from "@/lib"

async function getSessionHandler(_req: NextRequest, _context: ApiRouteContext, ...args: unknown[]) {
  const { id: sessionId } = await extractParams<{ id: string }>(args)

  const idValidation = validateID(sessionId)
  if (!idValidation.valid) {
    return createErrorResponse(idValidation.error || "Session ID không hợp lệ", { status: 400 })
  }

  // Sử dụng getSessionById (non-cached) để đảm bảo data luôn fresh
  // Theo chuẩn Next.js 16: không cache admin data trong API routes
  const session = await getSessionById(sessionId)

  if (!session) {
    return createErrorResponse("Session not found", { status: 404 })
  }

  return createSuccessResponse(serializeSessionDetail(session))
}

async function putSessionHandler(req: NextRequest, context: ApiRouteContext, ...args: unknown[]) {
  try {
    const { id: sessionId } = await extractParams<{ id: string }>(args)

    const idValidation = validateID(sessionId)
    if (!idValidation.valid) {
      return createErrorResponse(idValidation.error || "Session ID không hợp lệ", { status: 400 })
    }

    const body = await parseRequestBody(req)

    // Validate body với Zod schema
    const validationResult = UpdateSessionSchema.safeParse(body)
    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0]
      return createErrorResponse(firstError?.message || "Dữ liệu không hợp lệ", { status: 400 })
    }

    const userId = context.session.user?.id ?? "unknown"
    const ctx = createAuthContext(context, userId) as AuthContext

    const session = await updateSession(ctx, sessionId, validationResult.data)
    // Serialize session to client format (dates to strings)
    const serialized = {
      id: session.id,
      userId: session.userId,
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      userAgent: session.userAgent,
      ipAddress: session.ipAddress,
      isActive: session.isActive,
      expiresAt: session.expiresAt,
      lastActivity: session.lastActivity,
      createdAt: session.createdAt,
      deletedAt: session.deletedAt,
    }
    return createSuccessResponse(serialized)
  } catch (error) {
    return handleApiError(error, "Đã xảy ra lỗi khi cập nhật session", 500)
  }
}

async function deleteSessionHandler(_req: NextRequest, context: ApiRouteContext, ...args: unknown[]) {
  try {
    const { id: sessionId } = await extractParams<{ id: string }>(args)

    const idValidation = validateID(sessionId)
    if (!idValidation.valid) {
      return createErrorResponse(idValidation.error || "Session ID không hợp lệ", { status: 400 })
    }

    const userId = context.session.user?.id ?? "unknown"
    const ctx = createAuthContext(context, userId) as AuthContext

    await softDeleteSession(ctx, sessionId)
    return createSuccessResponse({ message: "Session deleted successfully" })
  } catch (error) {
    return handleApiError(error, "Đã xảy ra lỗi khi xóa session", 500)
  }
}

export const GET = createGetRoute(getSessionHandler)
export const PUT = createPutRoute(putSessionHandler)
export const DELETE = createDeleteRoute(deleteSessionHandler)

