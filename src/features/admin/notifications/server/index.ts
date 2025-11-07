/**
 * Server-side exports for Notifications feature
 * 
 * Structure:
 * - queries.ts: Non-cached database queries (dùng trong API routes)
 * - cache.ts: Cached queries với React cache() (dùng trong Server Components)
 * - helpers.ts: Helper functions for serialization
 */

// Non-cached queries (for API routes)
export {
  listNotifications,
  getNotificationById,
  getNotificationColumnOptions,
  type ListNotificationsInput,
  type ListedNotification,
  type ListNotificationsResult,
} from "./queries"

// Cached queries (for Server Components)
export {
  listNotificationsCached,
  getNotificationByIdCached,
  getNotificationColumnOptionsCached,
} from "./cache"

// Helpers
export {
  serializeNotificationForTable,
  serializeNotificationsList,
  serializeNotificationDetail,
} from "./helpers"

