import type { ResourceResponse, BaseResourceTableClientProps } from "@/features/admin/resources/types"

export interface CategoryRow {
  id: string
  name: string
  slug: string
  description: string | null
  createdAt: string
  deletedAt: string | null
}

export interface CategoriesTableClientProps extends BaseResourceTableClientProps<CategoryRow> {}

export type CategoriesResponse = ResourceResponse<CategoryRow>

export interface ListCategoriesInput {
  page?: number
  limit?: number
  search?: string
  filters?: Record<string, string>
  status?: "active" | "deleted" | "all"
}

export interface ListedCategory {
  id: string
  name: string
  slug: string
  description: string | null
  createdAt: Date
  deletedAt: Date | null
}

export interface CategoryDetail extends ListedCategory {
  updatedAt: Date
}

export interface ListCategoriesResult {
  data: ListedCategory[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface CreateCategoryInput {
  name: string
  slug: string
  description?: string | null
}

export interface UpdateCategoryInput {
  name?: string
  slug?: string
  description?: string | null
}

export interface BulkActionResult {
  success: boolean
  message: string
  affected: number
}

