import { AdminHeader } from "@/components/headers"
import { RoleCreate } from "@/features/admin/roles/components/role-create"

export default async function RoleCreatePage() {
  return (
    <>
      <AdminHeader
        breadcrumbs={[
          { label: "Vai trò", href: "/admin/roles" },
          { label: "Tạo mới", isActive: true },
        ]}
      />
      <div className="flex flex-1 flex-col">
        <RoleCreate backUrl="/admin/roles" />
      </div>
    </>
  )
}

