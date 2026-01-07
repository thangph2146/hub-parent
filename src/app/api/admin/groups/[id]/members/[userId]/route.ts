import { NextRequest } from "next/server"
import { createDeleteRoute } from "@/lib/api/api-route-wrapper"
import { removeGroupMember } from "@/features/admin/chat/server"
import {
  extractParams,
  getUserId,
  createAuthContext,
  handleApiError,
} from "@/lib/api/api-route-helpers"
import { createSuccessResponse } from "@/lib/config"
import type { ApiRouteContext } from "@/lib/api/types"

async function removeGroupMemberHandler(req: NextRequest, context: ApiRouteContext, ...args: unknown[]) {
  const userId = getUserId(context)
  const { id: groupId, userId: memberId } = await extractParams<{ id: string; userId: string }>(args)

  try {
    await removeGroupMember(createAuthContext(context, userId), { groupId, memberId })
    return createSuccessResponse({ success: true })
  } catch (error) {
    return handleApiError(error, "Đã xảy ra lỗi khi xóa thành viên", 500)
  }
}

export const DELETE = createDeleteRoute(removeGroupMemberHandler)

