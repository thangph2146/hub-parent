/**
 * Cache Functions for Public Posts
 * 
 * Sử dụng React cache() để:
 * - Tự động deduplicate requests trong cùng một render pass
 * - Cache kết quả để tái sử dụng
 * - Cải thiện performance với request deduplication
 * 
 * Pattern: Server Component → Cache Function → Database Query
 */

import { cache } from "react"
import { getPosts, getPostBySlug, getCategories, getRelatedPosts, type GetPostsParams, type PostsResult } from "./queries"
import type { Post, PostDetail } from "../types"

/**
 * Cache function: Get posts with pagination
 * 
 * @param params - GetPostsParams
 * @returns PostsResult
 */
export const getPostsCached = cache(async (params: GetPostsParams = {}): Promise<PostsResult> => {
  return getPosts(params)
})

/**
 * Cache function: Get post detail by slug
 * 
 * @param slug - Post slug
 * @returns Post detail hoặc null nếu không tìm thấy
 */
export const getPostBySlugCached = cache(async (slug: string): Promise<PostDetail | null> => {
  return getPostBySlug(slug)
})

/**
 * Cache function: Get categories with published posts
 * 
 * @returns Array of categories
 */
export const getCategoriesCached = cache(async () => {
  return getCategories()
})

/**
 * Cache function: Get related posts
 * 
 * @param postId - Current post ID to exclude
 * @param categoryIds - Array of category IDs
 * @param tagIds - Array of tag IDs
 * @param limit - Maximum number of related posts (default: 4)
 * @returns Array of related posts
 */
export const getRelatedPostsCached = cache(
  async (
    postId: string,
    categoryIds: string[],
    tagIds: string[],
    limit: number = 4
  ): Promise<Post[]> => {
    return getRelatedPosts(postId, categoryIds, tagIds, limit)
  }
)

