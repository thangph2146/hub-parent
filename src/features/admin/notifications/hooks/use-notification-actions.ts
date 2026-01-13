import { createResourceActionsHook } from "@/features/admin/resources/hooks"
import type { NotificationRow } from "../types"
import { NOTIFICATION_MESSAGES } from "../constants"
import { apiRoutes, queryKeys } from "@/constants"

/**
 * Hook quản lý các hành động trên resource Notification (Admin)
 * Được chuẩn hóa theo Base Resource Pattern
 */
export const useNotificationActions = createResourceActionsHook<NotificationRow>({
  resourceName: "notifications",
  messages: {
    DELETE_SUCCESS: NOTIFICATION_MESSAGES.DELETE_SUCCESS,
    DELETE_ERROR: NOTIFICATION_MESSAGES.DELETE_ERROR,
    BULK_DELETE_SUCCESS: NOTIFICATION_MESSAGES.BULK_DELETE_SUCCESS,
    BULK_DELETE_ERROR: NOTIFICATION_MESSAGES.BULK_DELETE_ERROR,
    MARK_READ_SUCCESS: NOTIFICATION_MESSAGES.MARK_READ_SUCCESS,
    MARK_READ_ERROR: NOTIFICATION_MESSAGES.MARK_READ_ERROR,
    MARK_UNREAD_SUCCESS: NOTIFICATION_MESSAGES.MARK_UNREAD_SUCCESS,
    MARK_UNREAD_ERROR: NOTIFICATION_MESSAGES.MARK_UNREAD_ERROR,
    BULK_MARK_READ_SUCCESS: NOTIFICATION_MESSAGES.BULK_MARK_READ_SUCCESS,
    BULK_MARK_READ_ERROR: NOTIFICATION_MESSAGES.BULK_MARK_READ_ERROR,
    BULK_MARK_UNREAD_SUCCESS: NOTIFICATION_MESSAGES.BULK_MARK_UNREAD_SUCCESS,
    BULK_MARK_UNREAD_ERROR: NOTIFICATION_MESSAGES.BULK_MARK_UNREAD_ERROR,
    UNKNOWN_ERROR: NOTIFICATION_MESSAGES.UNKNOWN_ERROR,
    RESTORE_SUCCESS: "Đã khôi phục",
    RESTORE_ERROR: "Lỗi khôi phục",
    HARD_DELETE_SUCCESS: "Đã xóa vĩnh viễn",
    HARD_DELETE_ERROR: "Lỗi xóa vĩnh viễn",
    BULK_RESTORE_SUCCESS: "Đã khôi phục",
    BULK_RESTORE_ERROR: "Lỗi khôi phục",
    BULK_HARD_DELETE_SUCCESS: "Đã xóa vĩnh viễn",
    BULK_HARD_DELETE_ERROR: "Lỗi xóa vĩnh viễn",
  },
  getRecordName: (row) => row.title,
  getLogMetadata: (row) => ({ 
    notificationId: row.id, 
    userId: row.userId,
    kind: row.kind 
  }),
  customApiRoutes: {
    delete: (id) => apiRoutes.notifications.delete(id),
    bulk: apiRoutes.notifications.bulk,
    restore: (id) => apiRoutes.notifications.markRead(id), 
    hardDelete: (id) => apiRoutes.notifications.delete(id),
  },
  customQueryKeys: {
    all: () => queryKeys.notifications.admin(),
  },
})


