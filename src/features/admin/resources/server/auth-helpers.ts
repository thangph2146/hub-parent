import { getPermissions, getSession } from "@/auth/server"
import { isSuperAdmin } from "@/permissions"
import type { Permission } from "@/permissions"

export interface SessionWithMeta {
  user?: { id: string }
  roles?: Array<{ name: string }>
  permissions?: Array<string>
}

export interface AuthInfo {
  session: SessionWithMeta | null
  permissions: Permission[]
  roles: Array<{ name: string }>
  actorId?: string
  isSuperAdminUser: boolean
}

export const getAuthInfo = async (): Promise<AuthInfo> => {
  const [session, permissions] = await Promise.all([getSession(), getPermissions()])
  const sessionWithMeta = session as SessionWithMeta | null
  const roles = sessionWithMeta?.roles ?? []
  return {
    session: sessionWithMeta,
    permissions,
    roles,
    actorId: sessionWithMeta?.user?.id,
    isSuperAdminUser: isSuperAdmin(roles),
  }
};

