/**
 * Server Component: Notification Detail
 * 
 * Fetches notification data using cached server query and passes it to client component
 * for rendering UI with animations and interactions.
 * 
 * Pattern: Server Component (data fetching) -> Client Component (UI/interactions)
 */

import { getNotificationByIdCached } from "../server/cache"
import { serializeNotificationDetail } from "../server/helpers"
import { NotificationDetailClient } from "./notification-detail.client"
import type { NotificationDetailData } from "./notification-detail.client"
import { NotFoundMessage } from "@/features/admin/resources/components"

export interface NotificationDetailProps {
  notificationId: string
  backUrl?: string
}

/**
 * NotificationDetail Server Component
 * 
 * Fetches notification data on the server using cached query and passes it to client component.
 * This ensures:
 * - Data is fetched on server (better SEO, faster initial load)
 * - Automatic request deduplication via React cache()
 * - Server-side caching for better performance
 */
export async function NotificationDetail({ notificationId, backUrl = "/admin/notifications" }: NotificationDetailProps) {
  // Fetch notification data using cached server query
  const notification = await getNotificationByIdCached(notificationId)

  if (!notification) {
    return <NotFoundMessage resourceName="thông báo" />
  }

  // Transform notification data to match NotificationDetailData format (serialize dates)
  const notificationForDetail: NotificationDetailData = serializeNotificationDetail(notification) as NotificationDetailData

  // Pass data to client component for rendering
  return <NotificationDetailClient notification={notificationForDetail} backUrl={backUrl} />
}

