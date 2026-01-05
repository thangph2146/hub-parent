/**
 * API Route: GET /api/admin/posts/dates-with-posts
 * Returns list of dates that have published posts
 */
import { NextRequest, NextResponse } from "next/server"
import { getDatesWithPosts } from "@/features/admin/posts/server/queries"
import { createGetRoute } from "@/lib/api/api-route-wrapper"
import type { ApiRouteContext } from "@/lib/api/types"
import { PERMISSIONS, hasPermission } from "@/lib/permissions"
import { logger } from "@/lib/config/logger"

async function getDatesWithPostsHandler(req: NextRequest, context: ApiRouteContext) {
  logger.debug("[Posts API] getDatesWithPostsHandler called", {
    url: req.url,
    method: req.method,
    userId: context.session?.user?.id,
    email: context.session?.user?.email,
  })

  // Kiểm tra permission: nếu có POSTS_VIEW_ALL thì xem tất cả, nếu chỉ có POSTS_VIEW_OWN thì chỉ xem của mình
  const hasViewAllPermission = hasPermission(context.permissions, PERMISSIONS.POSTS_VIEW_ALL)
  const hasViewOwnPermission = hasPermission(context.permissions, PERMISSIONS.POSTS_VIEW_OWN)

  let authorId: string | undefined

  if (!hasViewAllPermission && hasViewOwnPermission && context.session?.user?.id) {
    authorId = context.session.user.id
    logger.debug("[Posts API] Applied authorId filter for dates", {
      userId: authorId,
      reason: "User has POSTS_VIEW_OWN but not POSTS_VIEW_ALL",
    })
  }

  const dates = await getDatesWithPosts(authorId)

  return NextResponse.json({ dates })
}

export const GET = createGetRoute(getDatesWithPostsHandler)

