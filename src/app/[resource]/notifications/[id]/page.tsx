import type { Metadata } from "next"
import { typography } from "@/lib/typography"
import { AdminHeader } from "@/components/layouts/headers"
import { NotificationDetail } from "@/features/admin/notifications/components/notification-detail"
import { validateRouteId } from "@/lib/validation/route-params"
import { FormPageSuspense } from "@/features/admin/resources/components"
import { getNotificationById } from "@/features/admin/notifications/server/queries"
import { createDetailBreadcrumbs, truncateBreadcrumbLabel } from "@/features/admin/resources/utils"

/**
 * Notification Detail Page Metadata (Dynamic)
 * 
 * Theo Next.js 16 best practices:
 * - Sử dụng generateMetadata để tạo metadata động dựa trên notification data
 * - Metadata được merge với admin layout và root layout
 * - Title sử dụng template từ root: "{Notification Title} | CMS"
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  // Sử dụng getNotificationById (non-cached) để đảm bảo data luôn fresh
  // Theo chuẩn Next.js 16: không cache admin data
  const notification = await getNotificationById(id)

  if (!notification) {
    return {
      title: "Không tìm thấy",
      description: "Thông báo không tồn tại",
    }
  }

  return {
    title: notification.title || "Chi tiết thông báo",
    description: notification.description || notification.title || "Chi tiết thông báo",
  }
}

/**
 * Notification Detail Page với Suspense cho streaming
 * 
 * Theo Next.js 16 best practices:
 * - Header render ngay, detail content stream khi ready
 */
async function NotificationDetailContent({ notificationId }: { notificationId: string }) {
  return <NotificationDetail notificationId={notificationId} backUrl="/admin/notifications" />
}

export default async function NotificationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  
  // Fetch notification data (non-cached) để hiển thị tên trong breadcrumb
  // Theo chuẩn Next.js 16: không cache admin data
  const notification = await getNotificationById(id)
  const notificationTitle = truncateBreadcrumbLabel(notification?.title || "Chi tiết")
  
  // Validate route ID
  const validatedId = validateRouteId(id, "Thông báo")
  if (!validatedId) {
    return (
      <>
        <AdminHeader
          breadcrumbs={createDetailBreadcrumbs({
            listLabel: "Thông báo",
            listPath: "/admin/notifications",
            detailLabel: notificationTitle,
            detailPath: `/admin/notifications/${id}`,
          })}
        />
        <div className="flex flex-1 flex-col gap-4 p-4">
          <div className="flex min-h-[400px] flex-1 items-center justify-center">
            <div className="text-center">
              <h2 className={`mb-2 ${typography.heading.h2}`}>ID không hợp lệ</h2>
              <p className={`${typography.body.muted.small}`}>
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
        breadcrumbs={createDetailBreadcrumbs({
          listLabel: "Thông báo",
          listPath: "/admin/notifications",
          detailLabel: notificationTitle,
          detailPath: `/admin/notifications/${id}`,
        })}
      />
      <div className="flex flex-1 flex-col gap-4 p-4">
        <FormPageSuspense fieldCount={6} sectionCount={1}>
          <NotificationDetailContent notificationId={validatedId} />
        </FormPageSuspense>
      </div>
    </>
  )
}

