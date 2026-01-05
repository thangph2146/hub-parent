/**
 * Public API Route: GET /api/post/dates-with-posts
 * Returns list of dates that have published posts (public access, no authentication required)
 */
import { NextResponse } from "next/server"
import { getDatesWithPosts } from "@/features/admin/posts/server/queries"
import { logger } from "@/lib/config/logger"

export async function GET() {
  logger.debug("[Public Posts API] getDatesWithPostsHandler called", {
    url: "/api/post/dates-with-posts",
    method: "GET",
  })

  // Public route: no authentication required, return all published posts dates
  const dates = await getDatesWithPosts()

  return NextResponse.json({ dates })
}

