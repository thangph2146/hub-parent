import { OrdersTable } from "@/features/admin/orders/components"
import { getTablePermissionsAsync } from "@/features/admin/resources/server"
import { getSession } from "@/lib/auth/auth-server"
import { TablePageSuspense } from "@/features/admin/resources/components"
import { PERMISSIONS } from "@/lib/permissions"

async function PaymentConfirmationsTableWithPermissions() {
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

export default function PaymentConfirmationsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Xác nhận thanh toán</h1>
      <p className="text-muted-foreground mb-6">
        Xem và xác nhận các đơn hàng đã thanh toán. Bạn có thể lọc theo trạng thái thanh toán &quot;PAID&quot; trong bảng.
      </p>
      <TablePageSuspense>
        <PaymentConfirmationsTableWithPermissions />
      </TablePageSuspense>
    </div>
  )
}

