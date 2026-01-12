import { NextRequest } from "next/server"
import { createDeleteRoute } from "@/lib"
import { removeGroupMember } from "@/features/admin/chat/server"
import {
  extractParams,
  getUserId,
  createAuthContext,
  handleApiError,
} from "@/lib"
import { createSuccessResponse } from "@/lib"
import type { ApiRouteContext } from "@/types"

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

