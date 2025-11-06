/**
 * Components Exports
 * 
 * Structure:
 * - Server Components: *.tsx (no "use client")
 * - Client Components: *.client.tsx hoặc *.tsx với "use client"
 */

// Server Components
export { NotificationsTable } from "./notifications-table"
export { NotificationDetail } from "./notification-detail"

// Client Components
export { NotificationsTableClient } from "./notifications-table.client"
export { NotificationDetailClient } from "./notification-detail.client"

// Types
export type { NotificationsTableProps } from "./notifications-table"
export type { NotificationDetailProps } from "./notification-detail"
export type { NotificationDetailClientProps, NotificationDetailData } from "./notification-detail.client"

