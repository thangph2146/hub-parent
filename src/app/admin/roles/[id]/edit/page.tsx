import { AdminHeader } from "@/components/headers"
import { RoleEdit } from "@/features/admin/roles/components/role-edit"
import { getRoleDetailById } from "@/features/admin/roles/server/cache"
import { validateRouteId } from "@/lib/validation/route-params"

export default async function RoleEditPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  
  // Validate route ID
  const validatedId = validateRouteId(id, "Vai trò")
  if (!validatedId) {
    return (
      <>
        <AdminHeader
          breadcrumbs={[
            { label: "Vai trò", href: "/admin/roles" },
            { label: "Chỉnh sửa", href: `/admin/roles/${id}/edit` },
          ]}
        />
        <div className="flex flex-1 flex-col gap-4 p-4">
          <div className="flex min-h-[400px] flex-1 items-center justify-center">
            <div className="text-center">
              <h2 className="mb-2 text-2xl font-bold">ID không hợp lệ</h2>
              <p className="text-muted-foreground">
                ID vai trò không hợp lệ.
              </p>
            </div>
          </div>
        </div>
      </>
    )
  }
  
  const role = await getRoleDetailById(validatedId)

  if (!role) {
    return (
      <>
        <AdminHeader
          breadcrumbs={[
            { label: "Vai trò", href: "/admin/roles" },
            { label: "Chỉnh sửa", href: `/admin/roles/${id}/edit` },
          ]}
        />
        <div className="flex flex-1 flex-col gap-4 p-4">
          <div className="flex min-h-[400px] flex-1 items-center justify-center">
            <div className="text-center">
              <h2 className="mb-2 text-2xl font-bold">Không tìm thấy vai trò</h2>
              <p className="text-muted-foreground">
                Vai trò bạn đang tìm kiếm không tồn tại.
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
          { label: "Vai trò", href: "/admin/roles" },
          { label: role.displayName, href: `/admin/roles/${id}` },
          { label: "Chỉnh sửa", isActive: true },
        ]}
      />
      <div className="flex flex-1 flex-col">
        <RoleEdit roleId={validatedId} variant="page" backUrl={`/admin/roles/${validatedId}`} />
      </div>
    </>
  )
}

