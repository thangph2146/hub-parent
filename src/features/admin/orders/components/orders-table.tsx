import { listOrders } from "../server/queries"
import { serializeOrdersList } from "../server/helpers"
import { OrdersTableClient } from "./orders-table.client"
import type { DataTableResult } from "@/components/tables"
import type { OrderRow } from "../types"

export interface OrdersTableProps {
  canDelete?: boolean
  canRestore?: boolean
  canManage?: boolean
  canCreate?: boolean
}

export async function OrdersTable({ canDelete, canRestore, canManage, canCreate }: OrdersTableProps) {
  const ordersData = await listOrders({
    page: 1,
    limit: 10,
    status: "active",
  })

  const serialized = serializeOrdersList(ordersData)
  const initialData: DataTableResult<OrderRow> = {
    rows: serialized.rows,
    page: ordersData.pagination.page,
    limit: serialized.limit,
    total: serialized.total,
    totalPages: serialized.totalPages,
  }

  return (
    <OrdersTableClient
      canDelete={canDelete}
      canRestore={canRestore}
      canManage={canManage}
      canCreate={canCreate}
      initialData={initialData}
    />
  )
}

