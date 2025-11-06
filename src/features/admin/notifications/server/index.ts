/**
 * Server-side exports for Notifications feature
 * 
 * Structure:
 * - queries.ts: Cached database queries
 * - helpers.ts: Helper functions for serialization
 */

// Queries
export {
  listNotificationsCached,
  getNotificationByIdCached,
  getNotificationById,
  type ListNotificationsInput,
  type ListedNotification,
  type ListNotificationsResult,
} from "./queries"

// Helpers
export {
  serializeNotificationForTable,
  serializeNotificationsList,
  serializeNotificationDetail,
} from "./helpers"

