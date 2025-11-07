import { AdminHeader } from "@/components/headers"
import { TagDetail } from "@/features/admin/tags/components/tag-detail"
import { validateRouteId } from "@/lib/validation/route-params"

interface TagDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function TagDetailPage({ params }: TagDetailPageProps) {
  const { id } = await params
  
  // Validate route ID
  const validatedId = validateRouteId(id, "Thẻ tag")
  if (!validatedId) {
    return (
      <>
        <AdminHeader
          breadcrumbs={[
            { label: "Thẻ tag", href: "/admin/tags" },
            { label: "Chi tiết", href: `/admin/tags/${id}` },
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
          { label: "Chi tiết", isActive: true },
        ]}
      />
      <div className="flex flex-1 flex-col gap-4 p-4">
        <TagDetail tagId={validatedId} backUrl="/admin/tags" />
      </div>
    </>
  )
}

