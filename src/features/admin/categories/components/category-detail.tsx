/**
 * Server Component: Category Detail
 * 
 * Fetches category data và pass xuống client component
 * Pattern: Server Component (data fetching) → Client Component (UI/interactions)
 */

import { getCategoryDetailById } from "../server/cache"
import { serializeCategoryDetail } from "../server/helpers"
import { CategoryDetailClient } from "./category-detail.client"
import type { CategoryDetailData } from "./category-detail.client"

export interface CategoryDetailProps {
  categoryId: string
  backUrl?: string
}

export async function CategoryDetail({ categoryId, backUrl = "/admin/categories" }: CategoryDetailProps) {
  const category = await getCategoryDetailById(categoryId)

  if (!category) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-4 md:p-6 lg:p-8">
        <div className="text-center">
          <p className="text-muted-foreground">Không tìm thấy danh mục</p>
        </div>
      </div>
    )
  }

  return (
    <CategoryDetailClient
      categoryId={categoryId}
      category={serializeCategoryDetail(category) as CategoryDetailData}
      backUrl={backUrl}
    />
  )
}

