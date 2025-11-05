import { AdminHeader } from "@/components/headers"
import { PERMISSIONS, canPerformAction, isSuperAdmin } from "@/lib/permissions"
import { getPermissions, getSession } from "@/lib/auth/auth-server"
import { NotificationsTable } from "@/features/admin/notifications/components/notifications-table"
import { ForbiddenNotice } from "@/components/shared"

interface SessionWithMeta {
  roles?: Array<{ name: string }>
  permissions?: Array<string>
}

/**
 * Notifications Page - CHỈ SUPER ADMIN ĐƯỢC TRUY CẬP
 * 
 * Page này hiển thị tất cả thông báo trong hệ thống để super admin quản lý và kiểm tra hành vi hệ thống.
 * Chỉ super admin mới có quyền truy cập trang này.
 * 
 * Permission checking:
 * - Page access: Chỉ super admin (checked ở đây)
 * - UI actions: canManage (dựa trên NOTIFICATIONS_MANAGE permission)
 */
export default async function NotificationsPage() {
  const session = (await getSession()) as SessionWithMeta | null
  const permissions = await getPermissions()
  const roles = session?.roles ?? []

  // Kiểm tra super admin - CHỈ SUPER ADMIN MỚI ĐƯỢC TRUY CẬP
  const isSuperAdminUser = isSuperAdmin(roles)

  if (!isSuperAdminUser) {
    return (
      <ForbiddenNotice
        breadcrumbs={[
          { label: "Thông báo", isActive: true },
        ]}
        title="Không có quyền truy cập"
        message="Trang này chỉ dành cho Super Admin. Chỉ Super Admin mới có quyền xem tất cả thông báo trong hệ thống để quản lý và kiểm tra hành vi hệ thống."
      />
    )
  }

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
        <NotificationsTable canManage={canManage} />
      </div>
    </>
  )
}

