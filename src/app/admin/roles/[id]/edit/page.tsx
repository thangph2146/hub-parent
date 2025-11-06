import { AdminHeader } from "@/components/headers"
import { RoleEdit } from "@/features/admin/roles/components/role-edit"
import { getRoleDetailById } from "@/features/admin/roles/server/cache"

export default async function RoleEditPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const role = await getRoleDetailById(id)

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
        <RoleEdit roleId={id} variant="page" backUrl={`/admin/roles/${id}`} />
      </div>
    </>
  )
}

