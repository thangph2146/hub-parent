/**
 * API Route: GET /api/admin/posts - List posts
 * POST /api/admin/posts - Create post
 */
import { NextRequest } from "next/server"
import { listPosts } from "@/features/admin/posts/server/queries"
import { serializePostsList } from "@/features/admin/posts/server/helpers"
import { createGetRoute, createPostRoute } from "@/lib"
import type { ApiRouteContext } from "@/types"
import { validatePagination, sanitizeSearchQuery, parseColumnFilters, filtersOrUndefined } from "@/utils"
import { parseRequestBody, createAuthContext, handleApiError } from "@/lib"
import { createSuccessResponse, createErrorResponse } from "@/lib"
import { PERMISSIONS, hasPermission } from "@/permissions"
import { createPost, type AuthContext } from "@/features/admin/posts/server/mutations"
import { createPostSchema } from "@/features/admin/posts/server/validation"

async function getPostsHandler(req: NextRequest, context: ApiRouteContext) {
  const searchParams = req.nextUrl.searchParams

  const paginationValidation = validatePagination({
    page: searchParams.get("page"),
    limit: searchParams.get("limit"),
  })

  if (!paginationValidation.valid) {
    return createErrorResponse(paginationValidation.error || "Invalid pagination parameters", { status: 400 })
  }

  const searchValidation = sanitizeSearchQuery(searchParams.get("search") || "", 200)
  const statusParam = searchParams.get("status") || "active"
  const status = (statusParam === "deleted" || statusParam === "all" ? statusParam : "active") as "active" | "deleted" | "all"

  const columnFilters = parseColumnFilters(searchParams, Infinity)

  // Kiểm tra permission: nếu có POSTS_VIEW_ALL thì xem tất cả, nếu chỉ có POSTS_VIEW_OWN thì chỉ xem của mình
  const hasViewAllPermission = hasPermission(context.permissions, PERMISSIONS.POSTS_VIEW_ALL)
  const hasViewOwnPermission = hasPermission(context.permissions, PERMISSIONS.POSTS_VIEW_OWN)
  
  // Nếu chỉ có POSTS_VIEW_OWN (không có POSTS_VIEW_ALL), filter theo authorId của user đang đăng nhập
  if (!hasViewAllPermission && hasViewOwnPermission && context.session?.user?.id) {
    columnFilters.authorId = context.session.user.id
  }
  
  // Sử dụng listPosts (non-cached) để đảm bảo data luôn fresh
  // API routes cần fresh data, không nên sử dụng cache để tránh trả về dữ liệu cũ
  const result = await listPosts({
    page: paginationValidation.page!,
    limit: paginationValidation.limit!,
    search: searchValidation.value || undefined,
    filters: filtersOrUndefined(columnFilters),
    status,
  })

  const serialized = serializePostsList(result)
  return createSuccessResponse({
    data: serialized.rows,
    pagination: {
      page: serialized.page,
      limit: serialized.limit,
      total: serialized.total,
      totalPages: serialized.totalPages,
    },
  })
}

async function postPostsHandler(req: NextRequest, context: ApiRouteContext) {
  try {
    const payload = await parseRequestBody(req)
    const userId = context.session.user?.id ?? "unknown"
    const ctx = createAuthContext(context, userId) as AuthContext

    // Kiểm tra permission: nếu không có POSTS_VIEW_ALL thì chỉ có thể tạo bài viết cho chính mình
    const hasViewAllPermission = hasPermission(context.permissions, PERMISSIONS.POSTS_VIEW_ALL)
    if (!hasViewAllPermission && context.session?.user?.id) {
      payload.authorId = context.session.user.id
    }

    // Validate body với Zod schema
    const validationResult = createPostSchema.safeParse(payload)
    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0]
      return createErrorResponse(firstError?.message || "Dữ liệu không hợp lệ", { status: 400 })
    }

    const created = await createPost(ctx, validationResult.data)
    return createSuccessResponse(created, { status: 201 })
  } catch (error) {
    return handleApiError(error, "Đã xảy ra lỗi khi tạo bài viết", 500)
  }
}

export const GET = createGetRoute(getPostsHandler)
export const POST = createPostRoute(postPostsHandler)

