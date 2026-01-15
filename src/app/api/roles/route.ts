/**
 * API Route: GET /api/roles - List roles
 */
import { NextRequest } from "next/server"
import { prisma } from "@/services/prisma"
import { PERMISSIONS } from "@/permissions"
import { createGetRoute } from "@/lib"
import { createSuccessResponse } from "@/lib"

async function getRolesHandler(
  _req: NextRequest,
  _context: {
    session: Awaited<ReturnType<typeof import("@/auth/server").requireAuth>>
    permissions: import("@/permissions").Permission[]
    roles: Array<{ name: string }>
  }
) {
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

  return createSuccessResponse(rolesList)
}

// Allow ROLES_VIEW, USERS_CREATE, or USERS_VIEW permission
// USERS_VIEW is included because roles are used for filtering in users table
export const GET = createGetRoute(getRolesHandler, {
  permissions: [
    PERMISSIONS.ROLES_VIEW,
    PERMISSIONS.USERS_CREATE,
    PERMISSIONS.USERS_VIEW, // Allow users who can view users to also see roles for filtering
  ],
})

