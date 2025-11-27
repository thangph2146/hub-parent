import { getNotificationById } from "../server/queries"
import { serializeNotificationDetail } from "../server/helpers"
import { NotificationDetailClient } from "./notification-detail.client"
import type { NotificationDetailData } from "./notification-detail.client"
import { NotFoundMessage } from "@/features/admin/resources/components"

export interface NotificationDetailProps {
  notificationId: string
  backUrl?: string
}

export async function NotificationDetail({ notificationId, backUrl = "/admin/notifications" }: NotificationDetailProps) {
  // Fetch notification data using non-cached query (theo chuẩn Next.js 16)
  const notification = await getNotificationById(notificationId)

  if (!notification) {
    return <NotFoundMessage resourceName="thông báo" />
  }

  // Transform notification data to match NotificationDetailData format (serialize dates)
  const notificationForDetail: NotificationDetailData = serializeNotificationDetail(notification) as NotificationDetailData

  // Pass data to client component for rendering
  return <NotificationDetailClient notificationId={notificationId} notification={notificationForDetail} backUrl={backUrl} />
}

