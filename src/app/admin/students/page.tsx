import { AdminHeader } from "@/components/headers"
import { PERMISSIONS, canPerformAction, canPerformAnyAction } from "@/lib/permissions"
import { getAuthInfo } from "@/features/admin/resources/server"
import { StudentsTable } from "@/features/admin/students/components/students-table"

/**
 * Students Page
 * 
 * Permission checking cho page access đã được xử lý ở layout level (PermissionGate)
 * Chỉ cần check permissions cho UI actions (canDelete, canRestore, canManage, canCreate)
 */
export default async function StudentsPage() {
  const { permissions, roles, actorId, isSuperAdminUser } = await getAuthInfo()

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

