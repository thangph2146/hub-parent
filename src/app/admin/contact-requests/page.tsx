import { AdminHeader } from "@/components/headers"
import { PERMISSIONS, canPerformAction } from "@/lib/permissions"
import { getAuthInfo } from "@/features/admin/resources/server"
import { ContactRequestsTable } from "@/features/admin/contact-requests/components/contact-requests-table"

/**
 * Contact Requests Page
 *
 * Permission checking cho page access đã được xử lý ở layout level (PermissionGate)
 * Chỉ cần check permissions cho UI actions (canDelete, canRestore, canManage, canUpdate, canAssign)
 */
export default async function ContactRequestsPage() {
  const { permissions, roles } = await getAuthInfo()

  // Check permissions cho UI actions (không phải page access)
  const canDelete = canPerformAction(permissions, roles, PERMISSIONS.CONTACT_REQUESTS_MANAGE)
  const canRestore = canPerformAction(permissions, roles, PERMISSIONS.CONTACT_REQUESTS_MANAGE)
  const canManage = canPerformAction(permissions, roles, PERMISSIONS.CONTACT_REQUESTS_MANAGE)
  const canUpdate = canPerformAction(permissions, roles, PERMISSIONS.CONTACT_REQUESTS_UPDATE)
  const canAssign = canPerformAction(permissions, roles, PERMISSIONS.CONTACT_REQUESTS_ASSIGN)

  return (
    <>
      <AdminHeader
        breadcrumbs={[
          { label: "Yêu cầu liên hệ", isActive: true },
        ]}
      />
      <div className="flex flex-1 flex-col gap-4 p-4">
        <ContactRequestsTable
          canDelete={canDelete}
          canRestore={canRestore}
          canManage={canManage}
          canUpdate={canUpdate}
          canAssign={canAssign}
        />
      </div>
    </>
  )
}

