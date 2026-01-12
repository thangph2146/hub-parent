/**
 * API Route: GET /api/admin/comments/[id] - Get comment
 * PUT /api/admin/comments/[id] - Update comment
 * DELETE /api/admin/comments/[id] - Soft delete comment
 */
import { NextRequest } from "next/server"
import { getCommentById } from "@/features/admin/comments/server/queries"
import { serializeCommentDetail } from "@/features/admin/comments/server/helpers"
import {
  updateComment,
  softDeleteComment,
  type AuthContext,
  ApplicationError,
  NotFoundError,
} from "@/features/admin/comments/server/mutations"
import { createGetRoute, createPutRoute, createDeleteRoute } from "@/lib"
import type { ApiRouteContext } from "@/types"
import { createErrorResponse, createSuccessResponse } from "@/lib"

async function getCommentHandler(_req: NextRequest, _context: ApiRouteContext, ...args: unknown[]) {
  const { params } = args[0] as { params: Promise<{ id: string }> }
  const { id: commentId } = await params

  if (!commentId) {
    return createErrorResponse("Comment ID is required", { status: 400 })
  }

  // Sử dụng getCommentById (non-cached) để đảm bảo data luôn fresh
  // API routes cần fresh data, không nên sử dụng cache để tránh trả về dữ liệu cũ
  const comment = await getCommentById(commentId)

  if (!comment) {
    return createErrorResponse("Comment not found", { status: 404 })
  }

  return createSuccessResponse(serializeCommentDetail(comment))
}

async function putCommentHandler(req: NextRequest, context: ApiRouteContext, ...args: unknown[]) {
  const { params } = args[0] as { params: Promise<{ id: string }> }
  const { id: commentId } = await params

  if (!commentId) {
    return createErrorResponse("Comment ID is required", { status: 400 })
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return createErrorResponse("Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.", { status: 400 })
  }

  const ctx: AuthContext = {
    actorId: context.session.user?.id ?? "unknown",
    permissions: context.permissions,
    roles: context.roles,
  }

  try {
    const comment = await updateComment(ctx, commentId, body)
    // Return full comment object (already includes updatedAt from mapCommentRecord)
    return createSuccessResponse(comment)
  } catch (error) {
    if (error instanceof ApplicationError) {
      return createErrorResponse(error.message || "Không thể cập nhật bình luận", { status: error.status || 400 })
    }
    if (error instanceof NotFoundError) {
      return createErrorResponse(error.message || "Không tìm thấy", { status: 404 })
    }
    return createErrorResponse("Đã xảy ra lỗi khi cập nhật bình luận", { status: 500 })
  }
}

async function deleteCommentHandler(_req: NextRequest, context: ApiRouteContext, ...args: unknown[]) {
  const { params } = args[0] as { params: Promise<{ id: string }> }
  const { id: commentId } = await params

  if (!commentId) {
    return createErrorResponse("Comment ID is required", { status: 400 })
  }

  const ctx: AuthContext = {
    actorId: context.session.user?.id ?? "unknown",
    permissions: context.permissions,
    roles: context.roles,
  }

  try {
    await softDeleteComment(ctx, commentId)
    return createSuccessResponse({ message: "Comment deleted successfully" })
  } catch (error) {
    if (error instanceof ApplicationError) {
      return createErrorResponse(error.message || "Không thể xóa bình luận", { status: error.status || 400 })
    }
    if (error instanceof NotFoundError) {
      return createErrorResponse(error.message || "Không tìm thấy", { status: 404 })
    }
    return createErrorResponse("Đã xảy ra lỗi khi xóa bình luận", { status: 500 })
  }
}

export const GET = createGetRoute(getCommentHandler)
export const PUT = createPutRoute(putCommentHandler)
export const DELETE = createDeleteRoute(deleteCommentHandler)
