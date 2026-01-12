/**
 * API Route: GET /api/admin/tags/[id] - Get tag
 * PUT /api/admin/tags/[id] - Update tag
 * DELETE /api/admin/tags/[id] - Soft delete tag
 */
import { NextRequest } from "next/server"
import { getTagById } from "@/features/admin/tags/server/queries"
import { serializeTagDetail } from "@/features/admin/tags/server/helpers"
import {
  updateTag,
  softDeleteTag,
  type AuthContext,
} from "@/features/admin/tags/server/mutations"
import { createGetRoute, createPutRoute, createDeleteRoute } from "@/lib"
import type { ApiRouteContext } from "@/types"
import { validateID } from "@/utils"
import { extractParams, parseRequestBody, createAuthContext, handleApiError } from "@/lib"
import { createSuccessResponse, createErrorResponse } from "@/lib"

async function getTagHandler(_req: NextRequest, _context: ApiRouteContext, ...args: unknown[]) {
  const { id: tagId } = await extractParams<{ id: string }>(args)

  const idValidation = validateID(tagId)
  if (!idValidation.valid) {
    return createErrorResponse(idValidation.error || "Tag ID không hợp lệ", { status: 400 })
  }

  // Sử dụng getTagById (non-cached) thay vì getTagDetailById để đảm bảo data luôn fresh
  // API routes cần fresh data, không nên sử dụng cache để tránh trả về dữ liệu cũ
  const tag = await getTagById(tagId)

  if (!tag) {
    return createErrorResponse("Tag not found", { status: 404 })
  }

  return createSuccessResponse(serializeTagDetail(tag))
}

async function putTagHandler(req: NextRequest, context: ApiRouteContext, ...args: unknown[]) {
  try {
    const { id: tagId } = await extractParams<{ id: string }>(args)

    const idValidation = validateID(tagId)
    if (!idValidation.valid) {
      return createErrorResponse(idValidation.error || "Tag ID không hợp lệ", { status: 400 })
    }

    const body = await parseRequestBody(req)

    const userId = context.session.user?.id ?? "unknown"
    const ctx = createAuthContext(context, userId) as AuthContext

    const tag = await updateTag(ctx, tagId, body)
    // Serialize tag to client format (dates to strings)
    const serialized = {
      id: tag.id,
      name: tag.name,
      slug: tag.slug,
      createdAt: tag.createdAt.toISOString(),
      deletedAt: tag.deletedAt ? tag.deletedAt.toISOString() : null,
    }
    return createSuccessResponse(serialized)
  } catch (error) {
    return handleApiError(error, "Đã xảy ra lỗi khi cập nhật thẻ tag", 500)
  }
}

async function deleteTagHandler(_req: NextRequest, context: ApiRouteContext, ...args: unknown[]) {
  try {
    const { id: tagId } = await extractParams<{ id: string }>(args)

    const idValidation = validateID(tagId)
    if (!idValidation.valid) {
      return createErrorResponse(idValidation.error || "Tag ID không hợp lệ", { status: 400 })
    }

    const userId = context.session.user?.id ?? "unknown"
    const ctx = createAuthContext(context, userId) as AuthContext

    await softDeleteTag(ctx, tagId)
    return createSuccessResponse({ message: "Tag deleted successfully" })
  } catch (error) {
    return handleApiError(error, "Đã xảy ra lỗi khi xóa thẻ tag", 500)
  }
}

export const GET = createGetRoute(getTagHandler)
export const PUT = createPutRoute(putTagHandler)
export const DELETE = createDeleteRoute(deleteTagHandler)

