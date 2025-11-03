/**
 * API Route: DELETE /api/users/[id]/hard-delete - Hard delete user (xóa vĩnh viễn)
 */
import { NextRequest, NextResponse } from "next/server"
import { requireAuth, getPermissions } from "@/lib/api/auth-server"
import { PERMISSIONS } from "@/lib/permissions"
import { canPerformAnyAction } from "@/lib/permissions-helpers"
import {
  ApplicationError,
  type AuthContext,
  hardDeleteUser,
} from "@/features/users/server/mutations"

function buildAuthContext(
  session: Awaited<ReturnType<typeof requireAuth>>,
  permissions: Awaited<ReturnType<typeof getPermissions>>,
  roles: Array<{ name: string }>,
): AuthContext {
  return {
    actorId: session.user?.id ?? "unknown",
    permissions,
    roles,
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const session = await requireAuth()
    const permissions = await getPermissions()
    const sessionWithRoles = session as typeof session & { roles?: Array<{ name: string }> }
    const roles = sessionWithRoles?.roles ?? []

    // Hard delete requires USERS_MANAGE permission
    if (!canPerformAnyAction(permissions, roles, [PERMISSIONS.USERS_MANAGE])) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    if (session.user?.id === id) {
      return NextResponse.json(
        { error: "Cannot delete your own account" },
        { status: 400 },
      )
    }

    const ctx = buildAuthContext(session, permissions, roles)

    await hardDeleteUser(ctx, id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error hard deleting user:", error)
    if (error instanceof ApplicationError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

