import { AdminHeader } from "@/components/layouts/headers"
import { ResourceFormSkeleton } from "@/components/layouts/skeletons"

export default function CategoryEditPageLoading() {
  return (
    <>
      <AdminHeader
        breadcrumbs={[
          { label: "Danh mục", href: "/admin/categories" },
          { label: "Chỉnh sửa", isActive: true },
        ]}
      />
      <div className="flex flex-1 flex-col gap-4 p-4">
        <ResourceFormSkeleton fieldCount={6} title={true} showCard={false} />
      </div>
    </>
  )
}

