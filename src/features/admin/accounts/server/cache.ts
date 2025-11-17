/**
 * Cache Functions for Accounts
 * 
 * Sử dụng React cache() để:
 * - Tự động deduplicate requests trong cùng một render pass
 * - Cache kết quả để tái sử dụng
 * - Cải thiện performance với request deduplication
 */

import { cache } from "react"
import { getCurrentUserProfile } from "./queries"
import type { AccountProfile } from "../types"

/**
 * Cache function: Get current user's account profile
 * 
 * @param userId - Current user ID
 * @returns AccountProfile hoặc null nếu không tìm thấy
 */
export const getCurrentUserProfileCached = cache(
  async (userId: string): Promise<AccountProfile | null> => {
    return getCurrentUserProfile(userId)
  }
)

