/**
 * Helper Functions for Notifications Server Logic
 * 
 * Chứa các helper functions được dùng chung bởi queries và components
 * Sử dụng generic helpers từ resources/server khi có thể
 */

import type { DataTableResult } from "@/components/tables"
import { serializeDate } from "@/features/admin/resources/server"
import type { ListNotificationsResult, ListedNotification } from "./queries"
import type { NotificationRow } from "../types"

/**
 * Serialize notification data for DataTable format
 */
export function serializeNotificationForTable(notification: ListedNotification): NotificationRow {
  return {
    id: notification.id,
    userId: notification.userId,
    userEmail: notification.user.email,
    userName: notification.user.name,
    kind: notification.kind,
    title: notification.title,
    description: notification.description,
    isRead: notification.isRead,
    actionUrl: notification.actionUrl,
    createdAt: serializeDate(notification.createdAt)!,
    readAt: serializeDate(notification.readAt),
    expiresAt: serializeDate(notification.expiresAt),
  }
}

/**
 * Serialize ListNotificationsResult to DataTable format
 * Sử dụng pattern từ resources/server nhưng customize cho notifications
 */
export function serializeNotificationsList(data: ListNotificationsResult): DataTableResult<NotificationRow> {
  return {
    page: data.pagination.page,
    limit: data.pagination.limit,
    total: data.pagination.total,
    totalPages: data.pagination.totalPages,
    rows: data.data.map(serializeNotificationForTable),
  }
}

/**
 * Serialize ListedNotification to client format (for detail page)
 */
export function serializeNotificationDetail(notification: ListedNotification) {
  return {
    id: notification.id,
    userId: notification.userId,
    user: notification.user,
    kind: notification.kind,
    title: notification.title,
    description: notification.description,
    isRead: notification.isRead,
    actionUrl: notification.actionUrl,
    metadata: notification.metadata,
    expiresAt: serializeDate(notification.expiresAt),
    createdAt: serializeDate(notification.createdAt)!,
    readAt: serializeDate(notification.readAt),
  }
}

