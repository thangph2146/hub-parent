/**
 * Server Component: Notifications Table
 * 
 * Fetches initial data và pass xuống client component
 * Pattern: Server Component (data fetching) → Client Component (UI/interactions)
 */
import { listNotificationsCached } from "../server/cache"
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
  const initial = await listNotificationsCached({
    page: 1,
    limit: 10,
    userId,
  })
  const initialData = serializeNotificationsList(initial)

  return <NotificationsTableClient canManage={canManage} initialData={initialData} isSuperAdmin={isSuperAdmin} />
}

