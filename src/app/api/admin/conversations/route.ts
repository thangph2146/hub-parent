/**
 * API Route: GET /api/admin/conversations - List conversations or get messages
 * 
 * Theo Next.js 16 best practices:
 * - Sử dụng createApiRoute wrapper để handle authentication và permissions
 * - Import cached queries từ features/admin/chat/server/cache
 * - Validate input và return proper error responses
 * - Support query params: otherUserId (optional) để get messages
 */

import { NextRequest, NextResponse } from "next/server"
import { createApiRoute } from "@/lib/api/api-route-wrapper"
import { listConversationsCached, getMessagesBetweenUsersCached } from "@/features/admin/chat/server/cache"
import type { ApiRouteContext } from "@/lib/api/types"

async function getConversationsHandler(req: NextRequest, context: ApiRouteContext) {
  if (!context.session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const searchParams = req.nextUrl.searchParams
  const page = parseInt(searchParams.get("page") || "1")
  const limit = parseInt(searchParams.get("limit") || "50")
  const search = searchParams.get("search") || undefined

  const result = await listConversationsCached({
    userId: context.session.user.id,
    page,
    limit,
    search,
  })

  return NextResponse.json(result)
}

async function getMessagesHandler(req: NextRequest, context: ApiRouteContext) {
  if (!context.session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const searchParams = req.nextUrl.searchParams
  const otherUserId = searchParams.get("otherUserId")
  const limit = parseInt(searchParams.get("limit") || "100")

  if (!otherUserId) {
    return NextResponse.json({ error: "otherUserId is required" }, { status: 400 })
  }

  const messages = await getMessagesBetweenUsersCached(context.session.user.id, otherUserId, limit)

  return NextResponse.json(messages)
}

export const GET = createApiRoute(async (req: NextRequest, context: ApiRouteContext) => {
  const searchParams = req.nextUrl.searchParams
  const otherUserId = searchParams.get("otherUserId")

  if (otherUserId) {
    return getMessagesHandler(req, context)
  } else {
    return getConversationsHandler(req, context)
  }
})

