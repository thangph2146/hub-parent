/**
 * API Route: GET /api/admin/posts - List posts
 * POST /api/admin/posts - Create post
 */
import { NextRequest, NextResponse } from "next/server"
import { listPosts } from "@/features/admin/posts/server/queries"
import { createGetRoute, createPostRoute } from "@/lib/api/api-route-wrapper"
import type { ApiRouteContext } from "@/lib/api/types"
import { validatePagination, sanitizeSearchQuery } from "@/lib/api/validation"
import { PERMISSIONS, hasPermission } from "@/lib/permissions"
import { createPost, type AuthContext, ApplicationError } from "@/features/admin/posts/server/mutations"
import { createPostSchema } from "@/features/admin/posts/server/validation"
import { logger } from "@/lib/config/logger"

async function getPostsHandler(req: NextRequest, context: ApiRouteContext) {
  logger.info("[Posts API] getPostsHandler called", {
    url: req.url,
    method: req.method,
    userId: context.session?.user?.id,
    email: context.session?.user?.email,
  })
  
  const searchParams = req.nextUrl.searchParams

  const paginationValidation = validatePagination({
    page: searchParams.get("page"),
    limit: searchParams.get("limit"),
  })

  if (!paginationValidation.valid) {
    return NextResponse.json({ error: paginationValidation.error }, { status: 400 })
  }

  const searchValidation = sanitizeSearchQuery(searchParams.get("search") || "", 200)
  const statusParam = searchParams.get("status") || "active"
  const status = statusParam === "deleted" || statusParam === "all" ? statusParam : "active"

  const columnFilters: Record<string, string> = {}
  searchParams.forEach((value, key) => {
    if (key.startsWith("filter[")) {
      const columnKey = key.replace("filter[", "").replace("]", "")
      const sanitizedValue = sanitizeSearchQuery(value, 100)
      if (sanitizedValue.valid && sanitizedValue.value) {
        columnFilters[columnKey] = sanitizedValue.value
      }
    }
  })

  // Kiểm tra permission: nếu có POSTS_VIEW_ALL thì xem tất cả, nếu chỉ có POSTS_VIEW_OWN thì chỉ xem của mình
  const hasViewAllPermission = hasPermission(context.permissions, PERMISSIONS.POSTS_VIEW_ALL)
  const hasViewOwnPermission = hasPermission(context.permissions, PERMISSIONS.POSTS_VIEW_OWN)
  
  logger.debug("[Posts API] Permission check", {
    userId: context.session?.user?.id,
    email: context.session?.user?.email,
    hasViewAllPermission,
    hasViewOwnPermission,
    permissions: context.permissions.filter((p) => p.includes("posts:view")),
    existingFilters: Object.keys(columnFilters),
  })
  
  // Nếu chỉ có POSTS_VIEW_OWN (không có POSTS_VIEW_ALL), filter theo authorId của user đang đăng nhập
  // Nếu có POSTS_VIEW_ALL thì không cần filter (xem tất cả)
  if (!hasViewAllPermission && hasViewOwnPermission && context.session?.user?.id) {
    // Chỉ filter nếu user chỉ có POSTS_VIEW_OWN, không có POSTS_VIEW_ALL
    // Nếu user không có cả hai permissions thì cũng không filter (sẽ bị chặn ở route permission check)
    columnFilters.authorId = context.session.user.id
    logger.info("[Posts API] Applied authorId filter", {
      userId: context.session.user.id,
      reason: "User has POSTS_VIEW_OWN but not POSTS_VIEW_ALL",
    })
  } else if (hasViewAllPermission) {
    logger.debug("[Posts API] No filter applied", {
      reason: "User has POSTS_VIEW_ALL permission",
    })
  } else {
    logger.warn("[Posts API] No filter applied", {
      reason: "User has neither POSTS_VIEW_ALL nor POSTS_VIEW_OWN",
      hasViewAllPermission,
      hasViewOwnPermission,
      userId: context.session?.user?.id,
    })
  }

  const activeFilters = Object.keys(columnFilters).length > 0 ? columnFilters : undefined
  
  logger.debug("[Posts API] Final filters", {
    activeFilters,
    filterCount: Object.keys(columnFilters).length,
  })
  // Sử dụng listPosts (non-cached) để đảm bảo data luôn fresh
  // API routes cần fresh data, không nên sử dụng cache để tránh trả về dữ liệu cũ
  const result = await listPosts({
    page: paginationValidation.page!,
    limit: paginationValidation.limit!,
    search: searchValidation.value || undefined,
    filters: activeFilters,
    status: status as "active" | "deleted" | "all",
  })

  return NextResponse.json(result)
}

async function postPostsHandler(req: NextRequest, context: ApiRouteContext) {
  let payload: Record<string, unknown>
  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ error: "Dữ liệu không hợp lệ. Vui lòng kiểm tra lại." }, { status: 400 })
  }

  const ctx: AuthContext = {
    actorId: context.session.user?.id ?? "unknown",
    permissions: context.permissions,
    roles: context.roles,
  }

  // Kiểm tra permission: nếu không có POSTS_VIEW_ALL thì chỉ có thể tạo bài viết cho chính mình
  const hasViewAllPermission = hasPermission(context.permissions, PERMISSIONS.POSTS_VIEW_ALL)
  if (!hasViewAllPermission && context.session?.user?.id) {
    payload.authorId = context.session.user.id
  }

  // Validate body với Zod schema
  const validationResult = createPostSchema.safeParse(payload)
  if (!validationResult.success) {
    const firstError = validationResult.error.issues[0]
    return NextResponse.json({ error: firstError?.message || "Dữ liệu không hợp lệ" }, { status: 400 })
  }

  try {
    const created = await createPost(ctx, validationResult.data)
    return NextResponse.json({ data: created })
  } catch (error) {
    if (error instanceof ApplicationError) {
      return NextResponse.json({ error: error.message || "Không thể tạo bài viết" }, { status: error.status || 400 })
    }
    console.error("Error creating post:", error)
    return NextResponse.json({ error: "Đã xảy ra lỗi khi tạo bài viết" }, { status: 500 })
  }
}

export const GET = createGetRoute(getPostsHandler)
export const POST = createPostRoute(postPostsHandler)

