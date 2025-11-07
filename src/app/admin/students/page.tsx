import { AdminHeader } from "@/components/headers"
import { PERMISSIONS, canPerformAction, canPerformAnyAction, isSuperAdmin } from "@/lib/permissions"
import { getPermissions, getSession } from "@/lib/auth/auth-server"

import { StudentsTable } from "@/features/admin/students/components/students-table"

interface SessionWithMeta {
  user?: {
    id: string
  }
  roles?: Array<{ name: string }>
  permissions?: Array<string>
}

/**
 * Students Page
 * 
 * Permission checking cho page access đã được xử lý ở layout level (PermissionGate)
 * Chỉ cần check permissions cho UI actions (canDelete, canRestore, canManage, canCreate)
 */
export default async function StudentsPage() {
  const session = (await getSession()) as SessionWithMeta | null
  const permissions = await getPermissions()
  const roles = session?.roles ?? []
  const actorId = session?.user?.id
  const isSuperAdminUser = isSuperAdmin(roles)

  // Check permissions cho UI actions (không phải page access)
  const canDelete = canPerformAnyAction(permissions, roles, [
    PERMISSIONS.STUDENTS_DELETE,
    PERMISSIONS.STUDENTS_MANAGE,
  ])
  const canRestore = canPerformAnyAction(permissions, roles, [
    PERMISSIONS.STUDENTS_UPDATE,
    PERMISSIONS.STUDENTS_MANAGE,
  ])
  const canManage = canPerformAction(permissions, roles, PERMISSIONS.STUDENTS_MANAGE)
  const canCreate = canPerformAction(permissions, roles, PERMISSIONS.STUDENTS_CREATE)

  return (
    <>
      <AdminHeader
        breadcrumbs={[
          { label: "Học sinh", isActive: true },
        ]}
      />
      <div className="flex flex-1 flex-col gap-4 p-4">
        <StudentsTable
          canDelete={canDelete}
          canRestore={canRestore}
          canManage={canManage}
          canCreate={canCreate}
          actorId={actorId}
          isSuperAdmin={isSuperAdminUser}
        />
      </div>
    </>
  )
}

