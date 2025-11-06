/**
 * API Route: POST /api/admin/roles/bulk
 * Body: { action: "delete" | "restore" | "hard-delete", ids: string[] }
 */
import { NextRequest, NextResponse } from "next/server"
import {
  type AuthContext,
  bulkSoftDeleteRoles,
  bulkRestoreRoles,
  bulkHardDeleteRoles,
} from "@/features/admin/roles/server/mutations"
import { PERMISSIONS } from "@/lib/permissions"
import { createPostRoute } from "@/lib/api/api-route-wrapper"
import type { ApiRouteContext } from "@/lib/api/types"
import { validateArray, validateEnum, validateID } from "@/lib/api/validation"

type BulkAction = "delete" | "restore" | "hard-delete"

async function bulkRolesHandler(req: NextRequest, context: ApiRouteContext) {
  const body = await req.json()
  const { action, ids } = body as { action?: BulkAction; ids?: unknown }

  const actionValidation = validateEnum(action, ["delete", "restore", "hard-delete"] as const, "Action")
  if (!actionValidation.valid) {
    return NextResponse.json({ error: actionValidation.error }, { status: 400 })
  }

  const idsValidation = validateArray<string>(ids, 1, 100, "Danh sách vai trò")
  if (!idsValidation.valid || !idsValidation.value) {
    return NextResponse.json(
      { error: idsValidation.error || "Danh sách vai trò phải có ít nhất 1 phần tử và tối đa 100 phần tử" },
      { status: 400 }
    )
  }

  for (const id of idsValidation.value) {
    const idValidation = validateID(id)
    if (!idValidation.valid) {
      return NextResponse.json({ error: `ID không hợp lệ: ${id}` }, { status: 400 })
    }
  }

  const ctx: AuthContext = {
    actorId: context.session.user?.id ?? "unknown",
    permissions: context.permissions,
    roles: context.roles,
  }

  const actions: Record<BulkAction, typeof bulkSoftDeleteRoles> = {
    delete: bulkSoftDeleteRoles,
    restore: bulkRestoreRoles,
    "hard-delete": bulkHardDeleteRoles,
  }

  const { count } = await actions[actionValidation.value!](ctx, idsValidation.value!)
  return NextResponse.json({ success: true, count })
}

export const POST = createPostRoute(bulkRolesHandler, {
  permissions: [PERMISSIONS.ROLES_DELETE, PERMISSIONS.ROLES_UPDATE, PERMISSIONS.ROLES_MANAGE],
  autoDetectPermissions: false,
})

