import { AdminHeader } from "@/components/headers"
import { TagEdit } from "@/features/admin/tags/components/tag-edit"
import { validateRouteId } from "@/lib/validation/route-params"

interface TagEditPageProps {
  params: Promise<{ id: string }>
}

export default async function TagEditPage({ params }: TagEditPageProps) {
  const { id } = await params
  
  // Validate route ID
  const validatedId = validateRouteId(id, "Thẻ tag")
  if (!validatedId) {
    return (
      <>
        <AdminHeader
          breadcrumbs={[
            { label: "Thẻ tag", href: "/admin/tags" },
            { label: "Chỉnh sửa", href: `/admin/tags/${id}/edit` },
          ]}
        />
        <div className="flex flex-1 flex-col gap-4 p-4">
          <div className="flex min-h-[400px] flex-1 items-center justify-center">
            <div className="text-center">
              <h2 className="mb-2 text-2xl font-bold">ID không hợp lệ</h2>
              <p className="text-muted-foreground">
                ID thẻ tag không hợp lệ.
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
          { label: "Thẻ tag", href: "/admin/tags" },
          { label: "Chỉnh sửa", isActive: true },
        ]}
      />
      <div className="flex flex-1 flex-col gap-4 p-4">
        <TagEdit tagId={validatedId} variant="page" backUrl={`/admin/tags/${validatedId}`} />
      </div>
    </>
  )
}

