/**
 * Server Component: Role Create
 * 
 * Fetches permissions và pass xuống client component
 * Pattern: Server Component (data fetching) → Client Component (UI/interactions)
 */

import { getAllPermissionsCached } from "../server/cache"
import { RoleCreateClient } from "./role-create.client"

export interface RoleCreateProps {
  backUrl?: string
}

export async function RoleCreate({ backUrl = "/admin/roles" }: RoleCreateProps) {
  const permissions = await getAllPermissionsCached()

  return <RoleCreateClient backUrl={backUrl} permissions={permissions} />
}

