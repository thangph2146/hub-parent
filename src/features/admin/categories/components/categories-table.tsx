import { listCategories } from "../server/queries"
import { serializeCategoriesList } from "../server/helpers"
import { CategoriesTableClient } from "./categories-table.client"

export interface CategoriesTableProps {
  canDelete?: boolean
  canRestore?: boolean
  canManage?: boolean
  canCreate?: boolean
}

export async function CategoriesTable({ canDelete, canRestore, canManage, canCreate }: CategoriesTableProps) {
  const categoriesData = await listCategories({
    page: 1,
    limit: 1000,
    status: "active",
  })

  return (
    <CategoriesTableClient
      canDelete={canDelete}
      canRestore={canRestore}
      canManage={canManage}
      canCreate={canCreate}
      initialData={serializeCategoriesList(categoriesData)}
    />
  )
}

