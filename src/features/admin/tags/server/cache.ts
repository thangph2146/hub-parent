/**
 * Cached Database Queries for Tags
 * 
 * LƯU Ý: Theo chuẩn Next.js 16 và yêu cầu không cache admin data,
 * các functions trong file này KHÔNG được sử dụng trong Server Components hoặc API routes.
 * Chỉ giữ lại để tương thích ngược hoặc cho các use case đặc biệt.
 * 
 * Server Components và API routes nên sử dụng trực tiếp query functions từ queries.ts
 * để đảm bảo data luôn fresh.
 * 
 * Pattern: Server Component → Query Function (non-cached) → Database Query
 */

import { cache } from "react"
import { unstable_cache } from "next/cache"
import { listTags, getTagById, getTagColumnOptions } from "./queries"
import type { ListTagsInput, ListTagsResult, TagDetail } from "../types"

/**
 * Cache function: List tags
 * Caching strategy: Cache by params string
 */
export const listTagsCached = cache(async (params: ListTagsInput = {}): Promise<ListTagsResult> => {
  const cacheKey = JSON.stringify(params)
  return unstable_cache(
    async () => listTags(params),
    ['tags-list', cacheKey],
    { 
      tags: ['tags'], 
      revalidate: 3600 
    }
  )()
})

/**
 * Cache function: Get tag by ID
 * Caching strategy: Cache by ID
 */
export const getTagDetailById = cache(async (id: string): Promise<TagDetail | null> => {
  return unstable_cache(
    async () => getTagById(id),
    [`tag-${id}`],
    { 
      tags: ['tags', `tag-${id}`],
      revalidate: 3600 
    }
  )()
})

/**
 * Cache function: Get tag column options for filters
 * Caching strategy: Cache by column and search
 */
export const getTagColumnOptionsCached = cache(
  async (
    column: string,
    search?: string,
    limit: number = 50
  ): Promise<Array<{ label: string; value: string }>> => {
    const cacheKey = `${column}-${search || ''}-${limit}`
    return unstable_cache(
      async () => getTagColumnOptions(column, search, limit),
      [`tag-options-${cacheKey}`],
      { 
        tags: ['tags', 'tag-options'],
        revalidate: 3600 
      }
    )()
  }
)

/**
 * Cache function: Get active tags for select options
 * Caching strategy: Global active tags list
 */
export const getActiveTagsForSelectCached = cache(
  async (limit: number = 100): Promise<Array<{ label: string; value: string }>> => {
    return unstable_cache(
      async () => {
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
      },
      [`active-tags-select-${limit}`],
      { 
        tags: ['tags', 'active-tags'],
        revalidate: 3600 
      }
    )()
  }
)
