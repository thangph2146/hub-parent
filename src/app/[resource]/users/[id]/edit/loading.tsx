import { AdminHeader } from "@/components/layouts/headers"
import { ResourceFormSkeleton } from "@/components/layouts/skeletons"

export default function UserEditPageLoading() {
  return (
    <>
      <AdminHeader
        breadcrumbs={[
          { label: "Users", href: "/admin/users" },
          { label: "Chi tiết", href: "#" },
          { label: "Chỉnh sửa", isActive: true },
        ]}
      />
      <div className="flex flex-1 flex-col gap-4 p-4">
        <ResourceFormSkeleton variant="page" fieldCount={8} showCard={false} />
      </div>
    </>
  )
}
