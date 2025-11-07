/**
 * Shared Auth Helpers for Admin Features
 * 
 * Các helper functions để fetch và check auth info được dùng chung
 * bởi tất cả admin features để giảm duplicate code
 */

import { getSession } from "@/lib/auth/auth-server"
import { getPermissions } from "@/lib/auth/auth-server"
import { isSuperAdmin } from "@/lib/permissions"
import type { Permission } from "@/lib/permissions"

/**
 * Session with metadata interface
 * Được dùng trong các page components
 */
export interface SessionWithMeta {
  user?: {
    id: string
  }
  roles?: Array<{ name: string }>
  permissions?: Array<string>
}

/**
 * Auth info result
 */
export interface AuthInfo {
  session: SessionWithMeta | null
  permissions: Permission[]
  roles: Array<{ name: string }>
  actorId?: string
  isSuperAdminUser: boolean
}

/**
 * Get auth info (session, permissions, roles, actorId, isSuperAdmin)
 * 
 * @returns AuthInfo object
 */
export async function getAuthInfo(): Promise<AuthInfo> {
  const [session, permissions] = await Promise.all([
    getSession(),
    getPermissions(),
  ])

  const sessionWithMeta = session as SessionWithMeta | null
  const roles = sessionWithMeta?.roles ?? []
  const actorId = sessionWithMeta?.user?.id
  const isSuperAdminUser = isSuperAdmin(roles)

  return {
    session: sessionWithMeta,
    permissions,
    roles,
    actorId,
    isSuperAdminUser,
  }
}

