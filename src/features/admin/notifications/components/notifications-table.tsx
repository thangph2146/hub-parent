/**
 * Server Component: Notifications Table
 * Fetches initial notification data and passes it to the client component
 * Sử dụng helpers từ resources/server và server/helpers
 */
import { listNotificationsCached } from "../server/queries"
import { serializeNotificationsList } from "../server/helpers"
import { NotificationsTableClient } from "./notifications-table.client"

export interface NotificationsTableProps {
  canManage?: boolean
  userId?: string // Nếu có, chỉ fetch notifications của user này (không phải super admin)
  isSuperAdmin?: boolean // Flag để biết user có phải super admin không
}

export async function NotificationsTable({ canManage, userId, isSuperAdmin }: NotificationsTableProps) {
  // Nếu userId được truyền vào, chỉ fetch notifications của user đó
  // Nếu không (super admin), fetch tất cả notifications
  const initial = await listNotificationsCached(1, 10, "", "", userId)
  const initialData = serializeNotificationsList(initial)

  return <NotificationsTableClient canManage={canManage} initialData={initialData} isSuperAdmin={isSuperAdmin} />
}

