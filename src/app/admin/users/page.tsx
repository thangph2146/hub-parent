import { AdminHeader } from "@/components/headers"
import { PERMISSIONS } from "@/lib/permissions"
import { getTablePermissionsAsync } from "@/features/admin/resources/server"
import { UsersTable } from "@/features/admin/users/components/users-table"

/**
 * Users Page
 * 
 * Permission checking cho page access đã được xử lý ở layout level (PermissionGate)
 * Chỉ cần check permissions cho UI actions (canDelete, canRestore, canManage, canCreate)
 */
export default async function UsersPage() {
  const { canDelete, canRestore, canManage, canCreate } = await getTablePermissionsAsync({
    delete: [PERMISSIONS.USERS_DELETE, PERMISSIONS.USERS_MANAGE],
    restore: [PERMISSIONS.USERS_UPDATE, PERMISSIONS.USERS_MANAGE],
    manage: PERMISSIONS.USERS_MANAGE,
    create: PERMISSIONS.USERS_CREATE,
  })

  return (
    <>
      <AdminHeader
        breadcrumbs={[
          { label: "Users", isActive: true },
        ]}
      />
      <div className="flex flex-1 flex-col gap-4 p-4">
        <UsersTable
          canDelete={canDelete}
          canRestore={canRestore}
          canManage={canManage}
          canCreate={canCreate}
        />
      </div>
    </>
  )
}
