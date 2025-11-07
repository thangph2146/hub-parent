import { AdminHeader } from "@/components/headers"
import { NotificationDetail } from "@/features/admin/notifications/components/notification-detail"
import { validateRouteId } from "@/lib/validation/route-params"

/**
 * Notification Detail Page (Server Component)
 * 
 * Permission checking cho page access đã được xử lý ở layout level (PermissionGate)
 * Route này yêu cầu NOTIFICATIONS_VIEW permission (được map trong route-permissions.ts)
 * 
 * Pattern: Page validates params -> NotificationDetail (server) -> NotificationDetailClient (client)
 */
export default async function NotificationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  
  // Validate route ID
  const validatedId = validateRouteId(id, "Thông báo")
  if (!validatedId) {
    return (
      <>
        <AdminHeader
          breadcrumbs={[
            { label: "Thông báo", href: "/admin/notifications" },
            { label: "Chi tiết", href: `/admin/notifications/${id}` },
          ]}
        />
        <div className="flex flex-1 flex-col gap-4 p-4">
          <div className="flex min-h-[400px] flex-1 items-center justify-center">
            <div className="text-center">
              <h2 className="mb-2 text-2xl font-bold">ID không hợp lệ</h2>
              <p className="text-muted-foreground">
                ID thông báo không hợp lệ.
              </p>
            </div>
          </div>
        </div>
      </>
    )
  }

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
        <NotificationDetail notificationId={validatedId} backUrl="/admin/notifications" />
      </div>
    </>
  )
}

