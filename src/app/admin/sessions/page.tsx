import { AdminHeader } from "@/components/headers"
import { PERMISSIONS } from "@/lib/permissions"
import { getTablePermissionsAsync } from "@/features/admin/resources/server"
import { SessionsTable } from "@/features/admin/sessions/components/sessions-table"

/**
 * Sessions Page
 * 
 * Permission checking cho page access đã được xử lý ở layout level (PermissionGate)
 * Chỉ cần check permissions cho UI actions (canDelete, canRestore, canManage, canCreate)
 */
export default async function SessionsPage() {
  const { canDelete, canRestore, canManage, canCreate } = await getTablePermissionsAsync({
    delete: [PERMISSIONS.SESSIONS_DELETE, PERMISSIONS.SESSIONS_MANAGE],
    restore: [PERMISSIONS.SESSIONS_UPDATE, PERMISSIONS.SESSIONS_MANAGE],
    manage: PERMISSIONS.SESSIONS_MANAGE,
    create: PERMISSIONS.SESSIONS_CREATE,
  })

  return (
    <>
      <AdminHeader
        breadcrumbs={[
          { label: "Session", isActive: true },
        ]}
      />
      <div className="flex flex-1 flex-col gap-4 p-4">
        <SessionsTable
          canDelete={canDelete}
          canRestore={canRestore}
          canManage={canManage}
          canCreate={canCreate}
        />
      </div>
    </>
  )
}

