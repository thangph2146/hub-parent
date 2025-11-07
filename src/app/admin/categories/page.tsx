import { AdminHeader } from "@/components/headers"
import { PERMISSIONS } from "@/lib/permissions"
import { getTablePermissionsAsync } from "@/features/admin/resources/server"
import { CategoriesTable } from "@/features/admin/categories/components/categories-table"

/**
 * Categories Page
 * 
 * Permission checking cho page access đã được xử lý ở layout level (PermissionGate)
 * Chỉ cần check permissions cho UI actions (canDelete, canRestore, canManage, canCreate)
 */
export default async function CategoriesPage() {
  const { canDelete, canRestore, canManage, canCreate } = await getTablePermissionsAsync({
    delete: [PERMISSIONS.CATEGORIES_DELETE, PERMISSIONS.CATEGORIES_MANAGE],
    restore: [PERMISSIONS.CATEGORIES_UPDATE, PERMISSIONS.CATEGORIES_MANAGE],
    manage: PERMISSIONS.CATEGORIES_MANAGE,
    create: PERMISSIONS.CATEGORIES_CREATE,
  })

  return (
    <>
      <AdminHeader
        breadcrumbs={[
          { label: "Danh mục", isActive: true },
        ]}
      />
      <div className="flex flex-1 flex-col gap-4 p-4">
        <CategoriesTable
          canDelete={canDelete}
          canRestore={canRestore}
          canManage={canManage}
          canCreate={canCreate}
        />
      </div>
    </>
  )
}

