/**
 * Cached Database Queries for Tags
 * 
 * Sử dụng React.cache() để tự động deduplicate requests và cache kết quả
 * Dùng cho Server Components để tối ưu performance
 */

import { cache } from "react"
import { listTags, getTagById, getTagColumnOptions } from "./queries"
import type { ListTagsInput, ListTagsResult, TagDetail } from "../types"

/**
 * Cache function: List tags
 * 
 * Sử dụng cache() để tự động deduplicate requests và cache kết quả
 * Dùng cho Server Components
 * 
 * @param params - ListTagsInput
 * @returns ListTagsResult
 */
export const listTagsCached = cache(async (params: ListTagsInput = {}): Promise<ListTagsResult> => {
  return listTags(params)
})

/**
 * Cache function: Get tag by ID
 * 
 * Sử dụng cache() để tự động deduplicate requests và cache kết quả
 * Dùng cho Server Components
 * 
 * @param id - Tag ID
 * @returns TagDetail | null
 */
export const getTagDetailById = cache(async (id: string): Promise<TagDetail | null> => {
  return getTagById(id)
})

/**
 * Cache function: Get tag column options for filters
 */
export const getTagColumnOptionsCached = cache(
  async (
    column: string,
    search?: string,
    limit: number = 50
  ): Promise<Array<{ label: string; value: string }>> => {
    return getTagColumnOptions(column, search, limit)
  }
)

/**
 * Cache function: Get active tags for select options
 * 
 * Sử dụng cache() để tự động deduplicate requests và cache kết quả
 * Dùng cho form select fields (tagIds, etc.)
 * 
 * @param limit - Maximum number of tags to return (default: 100)
 * @returns Array of { label, value } options
 */
export const getActiveTagsForSelectCached = cache(
  async (limit: number = 100): Promise<Array<{ label: string; value: string }>> => {
    const { prisma } = await import("@/lib/database/prisma")
    const tags = await prisma.tag.findMany({
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

    return tags.map((tag) => ({
      label: tag.name,
      value: tag.id,
    }))
  }
)

