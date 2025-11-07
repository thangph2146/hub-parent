import { AdminHeader } from "@/components/headers"
import { PERMISSIONS } from "@/lib/permissions"
import { getTablePermissionsAsync } from "@/features/admin/resources/server"
import { TagsTable } from "@/features/admin/tags/components/tags-table"

/**
 * Tags Page
 * 
 * Permission checking cho page access đã được xử lý ở layout level (PermissionGate)
 * Chỉ cần check permissions cho UI actions (canDelete, canRestore, canManage, canCreate)
 */
export default async function TagsPage() {
  const { canDelete, canRestore, canManage, canCreate } = await getTablePermissionsAsync({
    delete: [PERMISSIONS.TAGS_DELETE, PERMISSIONS.TAGS_MANAGE],
    restore: [PERMISSIONS.TAGS_UPDATE, PERMISSIONS.TAGS_MANAGE],
    manage: PERMISSIONS.TAGS_MANAGE,
    create: PERMISSIONS.TAGS_CREATE,
  })

  return (
    <>
      <AdminHeader
        breadcrumbs={[
          { label: "Thẻ tag", isActive: true },
        ]}
      />
      <div className="flex flex-1 flex-col gap-4 p-4">
        <TagsTable
          canDelete={canDelete}
          canRestore={canRestore}
          canManage={canManage}
          canCreate={canCreate}
        />
      </div>
    </>
  )
}

