import type { ResourceResponse, BaseResourceTableClientProps, ResourcePagination, BulkActionResult } from "@/features/admin/resources/types"

export interface CategoryRow {
  id: string
  name: string
  slug: string
  parentId: string | null
  parentName?: string | null
  description: string | null
  createdAt: string
  updatedAt?: string // Optional để hỗ trợ cache comparison
  deletedAt: string | null
  _count?: {
    children: number
  }
}

export type CategoriesTableClientProps = BaseResourceTableClientProps<CategoryRow>

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
  parentId: string | null
  description: string | null
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
  parent?: {
    id: string
    name: string
  } | null
  _count?: {
    children: number
  }
}

export type CategoryDetailInfo = ListedCategory

export interface ListCategoriesResult {
  data: ListedCategory[]
  pagination: ResourcePagination
}

// Types are now exported from schemas.ts
export type { CreateCategoryInput, UpdateCategoryInput, BulkCategoryActionInput } from "./server/schemas"

export type { BulkActionResult }

