/**
 * API Route: GET /api/roles - List roles
 */
import { NextResponse } from "next/server"
import { prisma } from "@/lib/database"
import { requireAuth, getPermissions } from "@/lib/auth"
import { PERMISSIONS, canPerformAction } from "@/lib/permissions"

export async function GET() {
  try {
    const session = await requireAuth()
    const permissions = await getPermissions()
    
    const sessionWithRoles = session as typeof session & {
      roles?: Array<{ name: string }>
    }
    const roles = sessionWithRoles?.roles || []

    // Check permission: roles:view (required to see available roles when creating users)
    // Super admin hoặc users:create có thể xem roles
    const canViewRoles = canPerformAction(
      permissions,
      roles,
      PERMISSIONS.ROLES_VIEW
    )
    const canCreateUsers = canPerformAction(
      permissions,
      roles,
      PERMISSIONS.USERS_CREATE
    )

    if (!canViewRoles && !canCreateUsers) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const rolesList = await prisma.role.findMany({
      where: {
        isActive: true,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        displayName: true,
        description: true,
      },
      orderBy: {
        displayName: "asc",
      },
    })

    return NextResponse.json({ data: rolesList })
  } catch (error) {
    console.error("Error fetching roles:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

