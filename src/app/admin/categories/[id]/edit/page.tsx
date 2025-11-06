import { AdminHeader } from "@/components/headers"
import { CategoryEdit } from "@/features/admin/categories/components/category-edit"

export default async function CategoryEditPage({
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
          { label: "Chỉnh sửa", isActive: true },
        ]}
      />
      <div className="flex flex-1 flex-col gap-4 p-4">
        <CategoryEdit categoryId={id} variant="page" backUrl={`/admin/categories/${id}`} />
      </div>
    </>
  )
}

