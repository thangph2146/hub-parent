/**
 * Cached Database Queries for Categories
 * 
 * Sử dụng React.cache() để tự động deduplicate requests và cache kết quả
 * Dùng cho Server Components để tối ưu performance
 */

import { cache } from "react"
import { listCategories, getCategoryById, getCategoryColumnOptions } from "./queries"
import type { ListCategoriesInput, ListCategoriesResult, CategoryDetail } from "../types"

/**
 * Cache function: List categories
 * 
 * Sử dụng cache() để tự động deduplicate requests và cache kết quả
 * Dùng cho Server Components
 * 
 * @param params - ListCategoriesInput
 * @returns ListCategoriesResult
 */
export const listCategoriesCached = cache(async (params: ListCategoriesInput = {}): Promise<ListCategoriesResult> => {
  return listCategories(params)
})

/**
 * Cache function: Get category by ID
 * 
 * Sử dụng cache() để tự động deduplicate requests và cache kết quả
 * Dùng cho Server Components
 * 
 * @param id - Category ID
 * @returns CategoryDetail | null
 */
export const getCategoryDetailById = cache(async (id: string): Promise<CategoryDetail | null> => {
  return getCategoryById(id)
})

/**
 * Cache function: Get category column options for filters
 * 
 * Sử dụng cache() để tự động deduplicate requests và cache kết quả
 * Dùng cho Server Components
 * 
 * @param column - Column name
 * @param search - Optional search query
 * @param limit - Maximum number of options
 * @returns Array of { label, value } options
 */
export const getCategoryColumnOptionsCached = cache(
  async (
    column: string,
    search?: string,
    limit: number = 50
  ): Promise<Array<{ label: string; value: string }>> => {
    return getCategoryColumnOptions(column, search, limit)
  }
)

/**
 * Cache function: Get active categories for select options
 * 
 * Sử dụng cache() để tự động deduplicate requests và cache kết quả
 * Dùng cho form select fields (categoryIds, etc.)
 * 
 * @param limit - Maximum number of categories to return (default: 100)
 * @returns Array of { label, value } options
 */
export const getActiveCategoriesForSelectCached = cache(
  async (limit: number = 100): Promise<Array<{ label: string; value: string }>> => {
    const { prisma } = await import("@/lib/database/prisma")
    const categories = await prisma.category.findMany({
      where: {
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: "asc",
      },
      take: limit,
    })

    return categories.map((category) => ({
      label: category.name,
      value: category.id,
    }))
  }
)

