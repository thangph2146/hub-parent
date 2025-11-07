import { AdminHeader } from "@/components/headers"
import { PERMISSIONS, canPerformAction } from "@/lib/permissions"
import { getAuthInfo } from "@/features/admin/resources/server"
import { NotificationsTable } from "@/features/admin/notifications/components/notifications-table"

/**
 * Notifications Page - TẤT CẢ ROLES ĐƯỢC TRUY CẬP
 * 
 * Page này hiển thị thông báo:
 * - Super Admin: Xem tất cả thông báo trong hệ thống
 * - Các roles khác: Chỉ xem thông báo của chính họ
 * 
 * Permission checking:
 * - Page access: Tất cả roles có NOTIFICATIONS_VIEW permission
 * - UI actions: canManage (dựa trên NOTIFICATIONS_MANAGE permission)
 */
export default async function NotificationsPage() {
  const { permissions, roles, actorId, isSuperAdminUser } = await getAuthInfo()
  
  // Nếu không phải super admin, chỉ xem notifications của chính họ
  const userId = isSuperAdminUser ? undefined : actorId

  // Check permissions cho UI actions
  const canManage = canPerformAction(permissions, roles, PERMISSIONS.NOTIFICATIONS_MANAGE)

  return (
    <>
      <AdminHeader
        breadcrumbs={[
          { label: "Thông báo", isActive: true },
        ]}
      />
      <div className="flex flex-1 flex-col gap-4 p-4">
        <NotificationsTable canManage={canManage} userId={userId} isSuperAdmin={isSuperAdminUser} />
      </div>
    </>
  )
}

