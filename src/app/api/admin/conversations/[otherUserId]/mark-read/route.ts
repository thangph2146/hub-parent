/**
 * API Route: POST /api/admin/conversations/[otherUserId]/mark-read
 * Mark all messages in a conversation as read
 * 
 * Theo Next.js 16 best practices:
 * - Sử dụng dynamic route [otherUserId]
 * - Validate input và return proper error responses
 */

import { NextRequest } from "next/server"
import { createPostRoute } from "@/lib"
import { markConversationAsRead } from "@/features/admin/chat/server/mutations"
import {
  extractParams,
  getUserId,
  createAuthContext,
  handleApiError,
} from "@/lib"
import { createSuccessResponse } from "@/lib"
import type { ApiRouteContext } from "@/types"

async function markConversationReadHandler(req: NextRequest, context: ApiRouteContext, ...args: unknown[]) {
  const userId = getUserId(context)
  const { otherUserId } = await extractParams<{ otherUserId: string }>(args)

  try {
    const result = await markConversationAsRead(createAuthContext(context, userId), userId, otherUserId)
    return createSuccessResponse({ count: result.count })
  } catch (error) {
    return handleApiError(error, "Đã xảy ra lỗi", 500)
  }
}

export const POST = createPostRoute(markConversationReadHandler)

