import { NextRequest } from "next/server"
import { createPostRoute } from "@/lib"
import { restoreGroup } from "@/features/admin/chat/server"
import {
  extractParams,
  getUserId,
  createAuthContext,
  handleApiError,
} from "@/lib"
import { createSuccessResponse } from "@/lib"
import type { ApiRouteContext } from "@/types"

async function restoreGroupHandler(req: NextRequest, context: ApiRouteContext, ...args: unknown[]) {
  const userId = getUserId(context)
  const { id } = await extractParams<{ id: string }>(args)

  try {
    const group = await restoreGroup(createAuthContext(context, userId), id)
    return createSuccessResponse({
      id: group.id,
      name: group.name,
      description: group.description,
      avatar: group.avatar,
      createdById: group.createdById,
      createdAt: group.createdAt.toISOString(),
      updatedAt: group.updatedAt.toISOString(),
      deletedAt: group.deletedAt?.toISOString() || null,
    })
  } catch (error) {
    return handleApiError(error, "Đã xảy ra lỗi khi khôi phục nhóm", 500)
  }
}

export const POST = createPostRoute(restoreGroupHandler)

