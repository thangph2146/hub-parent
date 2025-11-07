import { AdminHeader } from "@/components/headers"
import { PERMISSIONS } from "@/lib/permissions"
import { getTablePermissionsAsync } from "@/features/admin/resources/server"
import { RolesTable } from "@/features/admin/roles/components/roles-table"

/**
 * Roles Page
 * 
 * Permission checking cho page access đã được xử lý ở layout level (PermissionGate)
 * Chỉ cần check permissions cho UI actions (canDelete, canRestore, canManage, canCreate)
 */
export default async function RolesPage() {
  const { canDelete, canRestore, canManage, canCreate } = await getTablePermissionsAsync({
    delete: [PERMISSIONS.ROLES_DELETE, PERMISSIONS.ROLES_MANAGE],
    restore: [PERMISSIONS.ROLES_UPDATE, PERMISSIONS.ROLES_MANAGE],
    manage: PERMISSIONS.ROLES_MANAGE,
    create: PERMISSIONS.ROLES_CREATE,
  })

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

