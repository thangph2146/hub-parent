import { NextRequest } from "next/server"
import { createDeleteRoute } from "@/lib"
import { hardDeleteGroup } from "@/features/admin/chat/server"
import {
  extractParams,
  getUserId,
  createAuthContext,
  handleApiError,
} from "@/lib"
import { createSuccessResponse } from "@/lib"
import type { ApiRouteContext } from "@/types"

async function hardDeleteGroupHandler(req: NextRequest, context: ApiRouteContext, ...args: unknown[]) {
  const userId = getUserId(context)
  const { id } = await extractParams<{ id: string }>(args)

  try {
    await hardDeleteGroup(createAuthContext(context, userId), id)
    return createSuccessResponse({ success: true })
  } catch (error) {
    return handleApiError(error, "Đã xảy ra lỗi khi xóa vĩnh viễn nhóm", 500)
  }
}

export const DELETE = createDeleteRoute(hardDeleteGroupHandler)

