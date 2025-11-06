/**
 * Server Component: Roles Table
 * 
 * Fetches initial data và permissions, sau đó pass xuống client component
 * Pattern: Server Component (data fetching) → Client Component (UI/interactions)
 */

import { listRolesCached, getAllPermissionsCached } from "../server/cache"
import { serializeRolesList } from "../server/helpers"
import { RolesTableClient } from "./roles-table.client"

export interface RolesTableProps {
  canDelete?: boolean
  canRestore?: boolean
  canManage?: boolean
  canCreate?: boolean
}

export async function RolesTable({ canDelete, canRestore, canManage, canCreate }: RolesTableProps) {
  const [rolesData, permissions] = await Promise.all([
    listRolesCached(1, 10, "", "", "active"),
    getAllPermissionsCached(),
  ])

  return (
    <RolesTableClient
      canDelete={canDelete}
      canRestore={canRestore}
      canManage={canManage}
      canCreate={canCreate}
      initialData={serializeRolesList(rolesData)}
      initialPermissionsOptions={permissions}
    />
  )
}

