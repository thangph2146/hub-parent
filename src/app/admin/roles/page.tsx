import { AdminHeader } from "@/components/headers"
import { PERMISSIONS, canPerformAction, canPerformAnyAction } from "@/lib/permissions"
import { getPermissions, getSession } from "@/lib/auth/auth-server"

import { RolesTable } from "@/features/admin/roles/components/roles-table"

interface SessionWithMeta {
  roles?: Array<{ name: string }>
  permissions?: Array<string>
}

/**
 * Roles Page
 * 
 * Permission checking cho page access đã được xử lý ở layout level (PermissionGate)
 * Chỉ cần check permissions cho UI actions (canDelete, canRestore, canManage, canCreate)
 */
export default async function RolesPage() {
  const session = (await getSession()) as SessionWithMeta | null
  const permissions = await getPermissions()
  const roles = session?.roles ?? []

  // Check permissions cho UI actions (không phải page access)
  const canDelete = canPerformAnyAction(permissions, roles, [
    PERMISSIONS.ROLES_DELETE,
    PERMISSIONS.ROLES_MANAGE,
  ])
  const canRestore = canPerformAnyAction(permissions, roles, [
    PERMISSIONS.ROLES_UPDATE,
    PERMISSIONS.ROLES_MANAGE,
  ])
  const canManage = canPerformAction(permissions, roles, PERMISSIONS.ROLES_MANAGE)
  const canCreate = canPerformAction(permissions, roles, PERMISSIONS.ROLES_CREATE)

  return (
    <>
      <AdminHeader
        breadcrumbs={[
          { label: "Vai trò", isActive: true },
        ]}
      />
      <div className="flex flex-1 flex-col gap-4 p-4">
        <RolesTable
          canDelete={canDelete}
          canRestore={canRestore}
          canManage={canManage}
          canCreate={canCreate}
        />
      </div>
    </>
  )
}

