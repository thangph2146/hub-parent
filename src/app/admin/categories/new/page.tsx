import { AdminHeader } from "@/components/headers"
import { CategoryCreate } from "@/features/admin/categories/components/category-create"

export default async function CategoryCreatePage() {
  return (
    <>
      <AdminHeader
        breadcrumbs={[
          { label: "Danh mục", href: "/admin/categories" },
          { label: "Tạo mới", isActive: true },
        ]}
      />
      <div className="flex flex-1 flex-col gap-4 p-4">
        <CategoryCreate />
      </div>
    </>
  )
}

