import { AdminHeader } from "@/components/headers"
import { NotificationDetail } from "@/features/admin/notifications/components/notification-detail"

/**
 * Notification Detail Page (Server Component)
 * 
 * Permission checking cho page access đã được xử lý ở layout level (PermissionGate)
 * Route này yêu cầu NOTIFICATIONS_VIEW permission (được map trong route-permissions.ts)
 * 
 * Pattern: Page fetches data -> NotificationDetail (server) -> NotificationDetailClient (client)
 */
export default async function NotificationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return (
    <>
      <AdminHeader
        breadcrumbs={[
          { label: "Thông báo", href: "/admin/notifications" },
          { label: "Chi tiết", isActive: true },
        ]}
      />
      <div className="flex flex-1 flex-col gap-4 p-4">
        {/* NotificationDetail là server component, tự fetch data và render client component */}
        <NotificationDetail notificationId={id} backUrl="/admin/notifications" />
      </div>
    </>
  )
}

