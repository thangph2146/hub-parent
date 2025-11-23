/**
 * Cached Database Queries for Comments
 * 
 * Sử dụng unstable_cache (Data Cache) kết hợp với React cache (Request Memoization)
 * - unstable_cache: Cache kết quả giữa các requests (Persisted Cache)
 * - React cache: Deduplicate requests trong cùng một render pass
 * 
 * Pattern: Server Component → Cache Function → Database Query
 */

import { cache } from "react"
import { unstable_cache } from "next/cache"
import { listComments, getCommentById, getCommentColumnOptions } from "./queries"
import type { ListCommentsInput, ListCommentsResult, CommentDetail } from "../types"

/**
 * Normalize params để tạo cache key nhất quán
 * Đảm bảo filters.deleted có giá trị rõ ràng: false (active), true (deleted), hoặc undefined (all)
 */
function normalizeParams(params: ListCommentsInput): ListCommentsInput {
  const normalized: ListCommentsInput = {
    page: params.page ?? 1,
    limit: params.limit ?? 10,
    search: params.search || undefined,
    sortBy: params.sortBy || undefined,
    sortOrder: params.sortOrder || undefined,
  }

  // Normalize filters
  if (params.filters) {
    normalized.filters = {}
    
    // Xử lý deleted filter - giữ nguyên giá trị (true/false/undefined)
    // undefined = all, false = active, true = deleted
    if (params.filters.deleted !== undefined) {
      normalized.filters.deleted = params.filters.deleted
    }

    // Các filters khác
    if (params.filters.approved !== undefined) {
      normalized.filters.approved = params.filters.approved
    }
    if (params.filters.authorId) {
      normalized.filters.authorId = params.filters.authorId
    }
    if (params.filters.postId) {
      normalized.filters.postId = params.filters.postId
    }

    // Chỉ thêm filters nếu có ít nhất một filter
    if (Object.keys(normalized.filters).length === 0) {
      normalized.filters = undefined
    }
  }

  return normalized
}

/**
 * Cache function: List comments
 * Caching strategy: Cache by params string với status tag
 */
export const listCommentsCached = cache(async (params: ListCommentsInput = {}): Promise<ListCommentsResult> => {
  const normalizedParams = normalizeParams(params)
  const cacheKey = JSON.stringify(normalizedParams)
  // Xác định status từ filters.deleted
  const status = normalizedParams.filters?.deleted === true ? "deleted" : normalizedParams.filters?.deleted === false ? "active" : "all"
  const statusTag = status === "deleted" ? "deleted-comments" : status === "active" ? "active-comments" : "all-comments"
  
  return unstable_cache(
    async () => listComments(normalizedParams),
    ['comments-list', cacheKey],
    { 
      tags: ['comments', statusTag], 
      revalidate: 3600 
    }
  )()
})

/**
 * Cache function: Get comment by ID
 * Caching strategy: Cache by ID
 */
export const getCommentDetailById = cache(async (id: string): Promise<CommentDetail | null> => {
  return unstable_cache(
    async () => getCommentById(id),
    [`comment-detail-${id}`],
    { 
      tags: ['comments', `comment-${id}`],
      revalidate: 3600 
    }
  )()
})

/**
 * Cache function: Get comment column options for filters
 * Caching strategy: Cache by column and search
 */
export const getCommentColumnOptionsCached = cache(
  async (
    column: string,
    search?: string,
    limit: number = 50
  ): Promise<Array<{ label: string; value: string }>> => {
    const cacheKey = `${column}-${search || ''}-${limit}`
    return unstable_cache(
      async () => getCommentColumnOptions(column, search, limit),
      [`comment-options-${cacheKey}`],
      { 
        tags: ['comments', 'comment-options'],
        revalidate: 3600 
      }
    )()
  }
)
