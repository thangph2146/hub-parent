/**
 * Server Component: Notification Detail
 * 
 * Fetches notification data using cached server query and passes it to client component
 * for rendering UI with animations and interactions.
 * 
 * Pattern: Server Component (data fetching) -> Client Component (UI/interactions)
 */

import { getNotificationByIdCached } from "../server/queries"
import { serializeNotificationDetail } from "../server/helpers"
import { NotificationDetailClient } from "./notification-detail.client"
import type { NotificationDetailData } from "./notification-detail.client"

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
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-4 md:p-6 lg:p-8">
        <div className="text-center">
          <p className="text-muted-foreground">Không tìm thấy thông báo</p>
        </div>
      </div>
    )
  }

  // Transform notification data to match NotificationDetailData format (serialize dates)
  const notificationForDetail: NotificationDetailData = serializeNotificationDetail(notification) as NotificationDetailData

  // Pass data to client component for rendering
  return <NotificationDetailClient notification={notificationForDetail} backUrl={backUrl} />
}

