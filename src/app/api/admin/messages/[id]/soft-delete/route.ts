import { NextRequest } from "next/server"
import { createDeleteRoute } from "@/lib"
import { softDeleteMessage } from "@/features/admin/chat/server"
import {
  extractParams,
  getUserId,
  createAuthContext,
  handleApiError,
} from "@/lib"
import { createSuccessResponse } from "@/lib"
import type { ApiRouteContext } from "@/types"

async function softDeleteMessageHandler(req: NextRequest, context: ApiRouteContext, ...args: unknown[]) {
  const userId = getUserId(context)
  const { id } = await extractParams<{ id: string }>(args)

  try {
    const message = await softDeleteMessage(createAuthContext(context, userId), id)
    return createSuccessResponse({
      id: message.id,
      deletedAt: message.deletedAt?.toISOString() || null,
    })
  } catch (error) {
    return handleApiError(error, "Đã xảy ra lỗi khi xóa tin nhắn", 500)
  }
}

export const DELETE = createDeleteRoute(softDeleteMessageHandler)

