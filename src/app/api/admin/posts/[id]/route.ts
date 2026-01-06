import { NextRequest } from "next/server"
import { getPostById } from "@/features/admin/posts/server/queries"
import { serializePostDetail } from "@/features/admin/posts/server/helpers"
import { updatePost, deletePost, type AuthContext } from "@/features/admin/posts/server/mutations"
import { updatePostSchema } from "@/features/admin/posts/server/validation"
import { createGetRoute, createPutRoute, createDeleteRoute } from "@/lib/api/api-route-wrapper"
import type { ApiRouteContext } from "@/lib/api/types"
import { validateID } from "@/lib/api/validation"
import { PERMISSIONS, hasPermission } from "@/lib/permissions"
import { extractParams, parseRequestBody, createAuthContext, handleApiError } from "@/lib/api/api-route-helpers"
import { createSuccessResponse, createErrorResponse } from "@/lib/config"

async function getPostHandler(_req: NextRequest, context: ApiRouteContext, ...args: unknown[]) {
  const { id } = await extractParams<{ id: string }>(args)

  const idValidation = validateID(id)
  if (!idValidation.valid) {
    return createErrorResponse(idValidation.error || "ID không hợp lệ", { status: 400 })
  }

  // Sử dụng getPostById (non-cached) để đảm bảo data luôn fresh
  // Theo chuẩn Next.js 16: không cache admin data trong API routes
  const post = await getPostById(id)

  if (!post) {
    return createErrorResponse("Không tìm thấy bài viết", { status: 404 })
  }

  // Kiểm tra permission: nếu có POSTS_VIEW_ALL thì xem tất cả, nếu chỉ có POSTS_VIEW_OWN thì chỉ xem của mình
  const hasViewAllPermission = hasPermission(context.permissions, PERMISSIONS.POSTS_VIEW_ALL)
  const currentUserId = context.session?.user?.id

  if (!hasViewAllPermission && currentUserId && post.author?.id !== currentUserId) {
    return createErrorResponse("Bạn không có quyền xem bài viết này", { status: 403 })
  }

  return createSuccessResponse(serializePostDetail(post))
}

async function putPostHandler(req: NextRequest, context: ApiRouteContext, ...args: unknown[]) {
  try {
    const { id } = await extractParams<{ id: string }>(args)

    const idValidation = validateID(id)
    if (!idValidation.valid) {
      return createErrorResponse(idValidation.error || "ID không hợp lệ", { status: 400 })
    }

    const payload = await parseRequestBody(req)

    // Validate body với Zod schema
    const validationResult = updatePostSchema.safeParse(payload)
    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0]
      return createErrorResponse(firstError?.message || "Dữ liệu không hợp lệ", { status: 400 })
    }

    const userId = context.session.user?.id ?? "unknown"
    const ctx = createAuthContext(context, userId) as AuthContext

    const updated = await updatePost(ctx, id, validationResult.data)
    return createSuccessResponse(updated)
  } catch (error) {
    return handleApiError(error, "Đã xảy ra lỗi khi cập nhật bài viết", 500)
  }
}

async function deletePostHandler(_req: NextRequest, context: ApiRouteContext, ...args: unknown[]) {
  try {
    const { id } = await extractParams<{ id: string }>(args)

    const idValidation = validateID(id)
    if (!idValidation.valid) {
      return createErrorResponse(idValidation.error || "ID không hợp lệ", { status: 400 })
    }

    const userId = context.session.user?.id ?? "unknown"
    const ctx = createAuthContext(context, userId) as AuthContext

    await deletePost(ctx, id)
    return createSuccessResponse({ message: "Bài viết đã được xóa thành công" })
  } catch (error) {
    return handleApiError(error, "Đã xảy ra lỗi khi xóa bài viết", 500)
  }
}

export const GET = createGetRoute(getPostHandler)
export const PUT = createPutRoute(putPostHandler)
export const DELETE = createDeleteRoute(deletePostHandler)

