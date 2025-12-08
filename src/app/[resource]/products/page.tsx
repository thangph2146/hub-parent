import type { Metadata } from "next"
import { AdminHeader } from "@/components/layouts/headers"
import { PERMISSIONS, type Permission } from "@/lib/permissions"
import { getTablePermissionsAsync } from "@/features/admin/resources/server"
import { ProductsTable } from "@/features/admin/products/components"
import { TablePageSuspense } from "@/features/admin/resources/components"
import { createListBreadcrumbs } from "@/features/admin/resources/utils"

/**
 * Products Page Metadata
 * 
 * Theo Next.js 16 best practices:
 * - Metadata được merge với admin layout và root layout
 * - Title sử dụng template từ root: "Sản phẩm | CMS"
 */
export const metadata: Metadata = {
  title: "Sản phẩm",
  description: "Quản lý sản phẩm và danh mục",
}

/**
 * Products Page với Suspense cho streaming
 * 
 * Theo Next.js 16 best practices về Multiple Suspense Boundaries:
 * - Tách permissions và data fetching thành separate async components
 * - Sử dụng multiple Suspense boundaries để stream song song
 * - Header render ngay, permissions và table content stream độc lập
 * 
 * Benefits:
 * - Permissions có thể stream trước khi data ready
 * - Table có thể render với permissions đã có
 * - Better perceived performance với progressive loading
 * - ProductsTable component đã có internal Suspense boundaries cho data fetching
 */
async function ProductsTableWithPermissions() {
  // Fetch permissions
  const permissions = await getTablePermissionsAsync({
    delete: [PERMISSIONS.PRODUCTS_DELETE, PERMISSIONS.PRODUCTS_MANAGE],
    restore: [PERMISSIONS.PRODUCTS_UPDATE, PERMISSIONS.PRODUCTS_MANAGE],
    manage: [PERMISSIONS.PRODUCTS_UPDATE, PERMISSIONS.PRODUCTS_MANAGE] as Permission[],
    create: PERMISSIONS.PRODUCTS_CREATE,
  })

  return (
    <ProductsTable
      canDelete={permissions.canDelete}
      canRestore={permissions.canRestore}
      canManage={permissions.canManage}
      canCreate={permissions.canCreate}
    />
  )
}

export default async function ProductsPage() {
  return (
    <>
      <AdminHeader breadcrumbs={createListBreadcrumbs({ listLabel: "Products" })} />
      <div className="flex flex-1 flex-col gap-4 p-4">
        <TablePageSuspense columnCount={9} rowCount={10}>
          <ProductsTableWithPermissions />
        </TablePageSuspense>
      </div>
    </>
  )
}

