/**
 * API Route: GET /api/admin/contact-requests/[id] - Get contact request
 * PUT /api/admin/contact-requests/[id] - Update contact request
 * DELETE /api/admin/contact-requests/[id] - Soft delete contact request
 */
import { NextRequest } from "next/server"
import { getContactRequestById } from "@/features/admin/contact-requests/server/queries"
import { serializeContactRequestDetail } from "@/features/admin/contact-requests/server/helpers"
import {
  updateContactRequest,
  softDeleteContactRequest,
  type AuthContext,
} from "@/features/admin/contact-requests/server/mutations"
import { UpdateContactRequestSchema } from "@/features/admin/contact-requests/server/schemas"
import { createGetRoute, createPutRoute, createDeleteRoute } from "@/lib"
import type { ApiRouteContext } from "@/types"
import { validateID } from "@/utils"
import { extractParams, parseRequestBody, createAuthContext, handleApiError } from "@/lib"
import { createSuccessResponse, createErrorResponse } from "@/lib"

async function getContactRequestHandler(_req: NextRequest, _context: ApiRouteContext, ...args: unknown[]) {
  const { id: contactRequestId } = await extractParams<{ id: string }>(args)

  const idValidation = validateID(contactRequestId)
  if (!idValidation.valid) {
    return createErrorResponse(idValidation.error || "Contact Request ID không hợp lệ", { status: 400 })
  }

  // Sử dụng getContactRequestById (non-cached) để đảm bảo data luôn fresh
  // Theo chuẩn Next.js 16: không cache admin data trong API routes
  const contactRequest = await getContactRequestById(contactRequestId)

  if (!contactRequest) {
    return createErrorResponse("Contact Request not found", { status: 404 })
  }

  return createSuccessResponse(serializeContactRequestDetail(contactRequest))
}

async function putContactRequestHandler(req: NextRequest, context: ApiRouteContext, ...args: unknown[]) {
  try {
    const { id: contactRequestId } = await extractParams<{ id: string }>(args)

    const idValidation = validateID(contactRequestId)
    if (!idValidation.valid) {
      return createErrorResponse(idValidation.error || "Contact Request ID không hợp lệ", { status: 400 })
    }

    const body = await parseRequestBody(req)

    // Validate body với Zod schema
    const validationResult = UpdateContactRequestSchema.safeParse(body)
    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0]
      return createErrorResponse(firstError?.message || "Dữ liệu không hợp lệ", { status: 400 })
    }

    const userId = context.session.user?.id ?? "unknown"
    const ctx = createAuthContext(context, userId) as AuthContext

    const contactRequest = await updateContactRequest(ctx, contactRequestId, validationResult.data)
    // Serialize contact request to client format (dates to strings)
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
    return handleApiError(error, "Đã xảy ra lỗi khi cập nhật yêu cầu liên hệ", 500)
  }
}

async function deleteContactRequestHandler(_req: NextRequest, context: ApiRouteContext, ...args: unknown[]) {
  try {
    const { id: contactRequestId } = await extractParams<{ id: string }>(args)

    const idValidation = validateID(contactRequestId)
    if (!idValidation.valid) {
      return createErrorResponse(idValidation.error || "Contact Request ID không hợp lệ", { status: 400 })
    }

    const userId = context.session.user?.id ?? "unknown"
    const ctx = createAuthContext(context, userId) as AuthContext

    await softDeleteContactRequest(ctx, contactRequestId)
    return createSuccessResponse({ message: "Contact Request deleted successfully" })
  } catch (error) {
    return handleApiError(error, "Đã xảy ra lỗi khi xóa yêu cầu liên hệ", 500)
  }
}

export const GET = createGetRoute(getContactRequestHandler)
export const PUT = createPutRoute(putContactRequestHandler)
export const DELETE = createDeleteRoute(deleteContactRequestHandler)

