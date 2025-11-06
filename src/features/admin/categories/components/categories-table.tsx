/**
 * Server Component: Categories Table
 * 
 * Fetches initial data, sau đó pass xuống client component
 * Pattern: Server Component (data fetching) → Client Component (UI/interactions)
 */

import { listCategoriesCached } from "../server/cache"
import { serializeCategoriesList } from "../server/helpers"
import { CategoriesTableClient } from "./categories-table.client"

export interface CategoriesTableProps {
  canDelete?: boolean
  canRestore?: boolean
  canManage?: boolean
  canCreate?: boolean
}

export async function CategoriesTable({ canDelete, canRestore, canManage, canCreate }: CategoriesTableProps) {
  const categoriesData = await listCategoriesCached({
    page: 1,
    limit: 10,
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

