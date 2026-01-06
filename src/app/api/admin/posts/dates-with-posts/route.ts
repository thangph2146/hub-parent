/**
 * API Route: GET /api/admin/posts/dates-with-posts
 * Returns list of dates that have published posts
 */
import { NextRequest } from "next/server"
import { getDatesWithPosts } from "@/features/admin/posts/server/queries"
import { createGetRoute } from "@/lib/api/api-route-wrapper"
import type { ApiRouteContext } from "@/lib/api/types"
import { PERMISSIONS, hasPermission } from "@/lib/permissions"
import { createSuccessResponse } from "@/lib/config"

async function getDatesWithPostsHandler(req: NextRequest, context: ApiRouteContext) {
  // Kiểm tra permission: nếu có POSTS_VIEW_ALL thì xem tất cả, nếu chỉ có POSTS_VIEW_OWN thì chỉ xem của mình
  const hasViewAllPermission = hasPermission(context.permissions, PERMISSIONS.POSTS_VIEW_ALL)
  const hasViewOwnPermission = hasPermission(context.permissions, PERMISSIONS.POSTS_VIEW_OWN)

  let authorId: string | undefined

  if (!hasViewAllPermission && hasViewOwnPermission && context.session?.user?.id) {
    authorId = context.session.user.id
  }

  const dates = await getDatesWithPosts(authorId)

  return createSuccessResponse({ dates })
}

export const GET = createGetRoute(getDatesWithPostsHandler)

