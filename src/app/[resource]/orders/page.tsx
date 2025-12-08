import type { Metadata } from "next"
import { AdminHeader } from "@/components/layouts/headers"
import { PERMISSIONS, type Permission } from "@/lib/permissions"
import { getTablePermissionsAsync } from "@/features/admin/resources/server"
import { OrdersTable } from "@/features/admin/orders/components"
import { TablePageSuspense } from "@/features/admin/resources/components"
import { createListBreadcrumbs } from "@/features/admin/resources/utils"

/**
 * Orders Page Metadata
 * 
 * Theo Next.js 16 best practices:
 * - Metadata được merge với admin layout và root layout
 * - Title sử dụng template từ root: "Đơn hàng | CMS"
 */
export const metadata: Metadata = {
  title: "Đơn hàng",
  description: "Quản lý đơn hàng và thanh toán",
}

/**
 * Orders Page với Suspense cho streaming
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
 * - OrdersTable component đã có internal Suspense boundaries cho data fetching
 */
async function OrdersTableWithPermissions() {
  // Fetch permissions
  const permissions = await getTablePermissionsAsync({
    delete: [PERMISSIONS.ORDERS_DELETE, PERMISSIONS.ORDERS_MANAGE],
    restore: [PERMISSIONS.ORDERS_UPDATE, PERMISSIONS.ORDERS_MANAGE],
    manage: [PERMISSIONS.ORDERS_UPDATE, PERMISSIONS.ORDERS_MANAGE] as Permission[],
    create: PERMISSIONS.ORDERS_CREATE,
  })

  return (
    <OrdersTable
      canDelete={permissions.canDelete}
      canRestore={permissions.canRestore}
      canManage={permissions.canManage}
      canCreate={permissions.canCreate}
    />
  )
}

export default async function OrdersPage() {
  return (
    <>
      <AdminHeader breadcrumbs={createListBreadcrumbs({ listLabel: "Orders" })} />
      <div className="flex flex-1 flex-col gap-4 p-4">
        <TablePageSuspense columnCount={8} rowCount={10}>
          <OrdersTableWithPermissions />
        </TablePageSuspense>
      </div>
    </>
  )
}

