import { listProducts } from "../server/queries"
import { serializeProductsList } from "../server/helpers"
import { ProductsTableClient } from "./products-table.client"
import type { DataTableResult } from "@/components/tables"
import type { ProductRow } from "../types"

export interface ProductsTableProps {
  canDelete?: boolean
  canRestore?: boolean
  canManage?: boolean
  canCreate?: boolean
}

export async function ProductsTable({ canDelete, canRestore, canManage, canCreate }: ProductsTableProps) {
  const productsData = await listProducts({
    page: 1,
    limit: 10,
    status: "active",
  })

  const serialized = serializeProductsList(productsData)
  const initialData: DataTableResult<ProductRow> = {
    rows: serialized.rows,
    page: productsData.pagination.page,
    limit: serialized.limit,
    total: serialized.total,
    totalPages: serialized.totalPages,
  }

  return (
    <ProductsTableClient
      canDelete={canDelete}
      canRestore={canRestore}
      canManage={canManage}
      canCreate={canCreate}
      initialData={initialData}
    />
  )
}

