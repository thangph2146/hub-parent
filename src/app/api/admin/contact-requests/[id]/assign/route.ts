/**
 * API Route: POST /api/admin/contact-requests/[id]/assign - Assign contact request
 */
import { NextRequest } from "next/server"
import {
  assignContactRequest,
  type AuthContext,
} from "@/features/admin/contact-requests/server/mutations"
import { AssignContactRequestSchema } from "@/features/admin/contact-requests/server/schemas"
import { createPostRoute } from "@/lib/api/api-route-wrapper"
import type { ApiRouteContext } from "@/lib/api/types"
import { validateID } from "@/lib/api/validation"
import { extractParams, parseRequestBody, createAuthContext, handleApiError } from "@/lib/api/api-route-helpers"
import { createSuccessResponse, createErrorResponse } from "@/lib/config"

async function assignContactRequestHandler(req: NextRequest, context: ApiRouteContext, ...args: unknown[]) {
  try {
    const { id: contactRequestId } = await extractParams<{ id: string }>(args)

    const idValidation = validateID(contactRequestId)
    if (!idValidation.valid) {
      return createErrorResponse(idValidation.error || "Contact Request ID không hợp lệ", { status: 400 })
    }

    const body = await parseRequestBody(req)

    // Validate body với Zod schema
    const validationResult = AssignContactRequestSchema.safeParse(body)
    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0]
      return createErrorResponse(firstError?.message || "Dữ liệu không hợp lệ", { status: 400 })
    }

    const userId = context.session.user?.id ?? "unknown"
    const ctx = createAuthContext(context, userId) as AuthContext

    const contactRequest = await assignContactRequest(ctx, contactRequestId, validationResult.data)
    // Serialize contact request to client format
    const serialized = {
      id: contactRequest.id,
      name: contactRequest.name,
      email: contactRequest.email,
      phone: contactRequest.phone,
      subject: contactRequest.subject,
      content: contactRequest.content,
      status: contactRequest.status,
      priority: contactRequest.priority,
      isRead: contactRequest.isRead,
      userId: contactRequest.userId,
      assignedToId: contactRequest.assignedToId,
      assignedTo: contactRequest.assignedTo,
      createdAt: contactRequest.createdAt.toISOString(),
      updatedAt: contactRequest.updatedAt.toISOString(),
      deletedAt: contactRequest.deletedAt ? contactRequest.deletedAt.toISOString() : null,
    }
    return createSuccessResponse(serialized)
  } catch (error) {
    return handleApiError(error, "Đã xảy ra lỗi khi giao yêu cầu liên hệ", 500)
  }
}

export const POST = createPostRoute(assignContactRequestHandler)

