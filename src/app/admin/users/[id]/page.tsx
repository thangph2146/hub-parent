import { AdminHeader } from "@/components/headers"
import { UserDetail } from "@/features/admin/users/components/user-detail"
import { getUserDetailById } from "@/features/admin/users/server/cache"
import { validateRouteId } from "@/lib/validation/route-params"

/**
 * User Detail Page (Server Component)
 * 
 * Permission checking cho page access đã được xử lý ở layout level (PermissionGate)
 * Route này yêu cầu USERS_VIEW permission (được map trong route-permissions.ts)
 * 
 * Pattern: Page fetches data -> UserDetail (server) -> UserDetailClient (client)
 */
export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  
  // Validate route ID
  const validatedId = validateRouteId(id, "Người dùng")
  if (!validatedId) {
    return (
      <>
        <AdminHeader
          breadcrumbs={[
            { label: "Users", href: "/admin/users" },
            { label: "Chi tiết", href: `/admin/users/${id}` },
          ]}
        />
        <div className="flex flex-1 flex-col gap-4 p-4">
          <div className="flex min-h-[400px] flex-1 items-center justify-center">
            <div className="text-center">
              <h2 className="mb-2 text-2xl font-bold">ID không hợp lệ</h2>
              <p className="text-muted-foreground">
                ID người dùng không hợp lệ.
              </p>
            </div>
          </div>
        </div>
      </>
    )
  }
  
  const user = await getUserDetailById(validatedId)

  if (!user) {
    return (
      <>
        <AdminHeader
          breadcrumbs={[
            { label: "Users", href: "/admin/users" },
            { label: "Chi tiết", href: `/admin/users/${id}` },
          ]}
        />
        <div className="flex flex-1 flex-col gap-4 p-4">
          <div className="flex min-h-[400px] flex-1 items-center justify-center">
            <div className="text-center">
              <h2 className="mb-2 text-2xl font-bold">Không tìm thấy người dùng</h2>
              <p className="text-muted-foreground">
                Người dùng bạn đang tìm kiếm không tồn tại.
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
          { label: "Users", href: "/admin/users" },
          { label: "Chi tiết", isActive: true },
        ]}
      />
      <div className="flex flex-1 flex-col gap-4 p-4">
        {/* UserDetail là server component, tự fetch data và render client component */}
        <UserDetail userId={validatedId} backUrl="/admin/users" />
      </div>
    </>
  )
}

