import { OrdersTable } from "@/features/admin/orders/components"
import { getTablePermissionsAsync } from "@/features/admin/resources/server"
import { getSession } from "@/lib/auth/auth-server"
import { TablePageSuspense } from "@/features/admin/resources/components"
import { PERMISSIONS } from "@/lib/permissions"

async function PaymentsTableWithPermissions() {
  const session = await getSession()
  if (!session?.user?.id) {
    return <div>Unauthorized</div>
  }

  const permissions = await getTablePermissionsAsync({
    delete: [PERMISSIONS.ORDERS_DELETE],
    restore: [PERMISSIONS.ORDERS_UPDATE],
    manage: PERMISSIONS.ORDERS_MANAGE,
    create: PERMISSIONS.ORDERS_CREATE,
  })

  return (
    <OrdersTable
      canDelete={permissions.canDelete}
      canRestore={permissions.canManage}
      canManage={permissions.canManage}
      canCreate={permissions.canCreate}
    />
  )
}

export default function PaymentsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Quản lý thanh toán</h1>
      <p className="text-muted-foreground mb-6">
        Xem và quản lý các đơn hàng chờ thanh toán. Bạn có thể lọc theo trạng thái thanh toán &quot;PENDING&quot; trong bảng.
      </p>
      <TablePageSuspense>
        <PaymentsTableWithPermissions />
      </TablePageSuspense>
    </div>
  )
}

