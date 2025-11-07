/**
 * Cache Functions for Notifications
 * 
 * Sử dụng React cache() để:
 * - Tự động deduplicate requests trong cùng một render pass
 * - Cache kết quả để tái sử dụng
 * - Cải thiện performance với request deduplication
 * 
 * Pattern: Server Component → Cache Function → Database Query
 */

import { cache } from "react"
import { listNotifications, getNotificationById, getNotificationColumnOptions, type ListNotificationsInput, type ListNotificationsResult, type ListedNotification } from "./queries"

/**
 * Cache function: List notifications with pagination
 * 
 * Sử dụng cache() để tự động deduplicate requests và cache kết quả
 * Dùng cho Server Components
 * 
 * @param params - ListNotificationsInput
 * @returns ListNotificationsResult
 */
export const listNotificationsCached = cache(async (params: ListNotificationsInput = {}): Promise<ListNotificationsResult> => {
  return listNotifications(params)
})

/**
 * Cache function: Get notification by ID
 * 
 * Sử dụng cache() để tự động deduplicate requests và cache kết quả
 * Dùng cho Server Components
 * 
 * @param id - Notification ID
 * @returns ListedNotification | null
 */
export const getNotificationByIdCached = cache(async (id: string): Promise<ListedNotification | null> => {
  return getNotificationById(id)
})

/**
 * Cache function: Get notification column options for filters
 * 
 * Sử dụng cache() để tự động deduplicate requests và cache kết quả
 * Dùng cho filter options API route
 * 
 * @param column - Column name
 * @param search - Optional search query
 * @param limit - Maximum number of options
 * @returns Array of { label, value } options
 */
export const getNotificationColumnOptionsCached = cache(
  async (
    column: string,
    search?: string,
    limit: number = 50
  ): Promise<Array<{ label: string; value: string }>> => {
    return getNotificationColumnOptions(column, search, limit)
  }
)

