import { AdminHeader } from "@/components/headers"
import { CategoryDetail } from "@/features/admin/categories/components/category-detail"

export default async function CategoryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return (
    <>
      <AdminHeader
        breadcrumbs={[
          { label: "Danh mục", href: "/admin/categories" },
          { label: "Chi tiết", isActive: true },
        ]}
      />
      <div className="flex flex-1 flex-col gap-4 p-4">
        <CategoryDetail categoryId={id} />
      </div>
    </>
  )
}

