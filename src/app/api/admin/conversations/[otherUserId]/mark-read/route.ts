/**
 * API Route: POST /api/admin/conversations/[otherUserId]/mark-read
 * Mark all messages in a conversation as read
 * 
 * Theo Next.js 16 best practices:
 * - Sử dụng dynamic route [otherUserId]
 * - Validate input và return proper error responses
 */

import { NextRequest, NextResponse } from "next/server"
import { createApiRoute } from "@/lib/api/api-route-wrapper"
import { markConversationAsRead } from "@/features/admin/chat/server/mutations"
import { ApplicationError } from "@/features/admin/resources/server"
import type { ApiRouteContext } from "@/lib/api/types"

async function markConversationReadHandler(req: NextRequest, context: ApiRouteContext, ...args: unknown[]) {
  const { params } = args[0] as { params: Promise<{ otherUserId: string }> }
  const { otherUserId } = await params
  const userId = context.session?.user?.id

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const result = await markConversationAsRead(
      {
        actorId: userId,
        permissions: context.permissions,
        roles: context.roles,
      },
      userId,
      otherUserId
    )

    return NextResponse.json({ count: result.count })
  } catch (error) {
    if (error instanceof ApplicationError) {
      return NextResponse.json({ error: error.message }, { status: error.status || 400 })
    }
    console.error("Error marking conversation as read:", error)
    return NextResponse.json({ error: "Đã xảy ra lỗi" }, { status: 500 })
  }
}

export const POST = createApiRoute(markConversationReadHandler)

