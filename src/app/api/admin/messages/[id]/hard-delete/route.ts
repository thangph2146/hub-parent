import { NextRequest } from "next/server"
import { createDeleteRoute } from "@/lib"
import { hardDeleteMessage } from "@/features/admin/chat/server"
import {
  extractParams,
  getUserId,
  createAuthContext,
  handleApiError,
} from "@/lib"
import { createSuccessResponse } from "@/lib"
import type { ApiRouteContext } from "@/types"

async function hardDeleteMessageHandler(req: NextRequest, context: ApiRouteContext, ...args: unknown[]) {
  const userId = getUserId(context)
  const { id } = await extractParams<{ id: string }>(args)

  try {
    await hardDeleteMessage(createAuthContext(context, userId), id)
    return createSuccessResponse({ success: true })
  } catch (error) {
    return handleApiError(error, "Đã xảy ra lỗi khi xóa vĩnh viễn tin nhắn", 500)
  }
}

export const DELETE = createDeleteRoute(hardDeleteMessageHandler)

