import { AdminHeader } from "@/components/layouts/headers"
import { ResourceDetailSkeleton } from "@/components/layouts/skeletons"

export default function SessionCreatePageLoading() {
  return (
    <>
      <AdminHeader
        breadcrumbs={[
          { label: "Session", href: "/admin/sessions" },
          { label: "Tạo mới", isActive: true },
        ]}
      />
      <div className="flex flex-1 flex-col gap-4 p-4">
        <ResourceDetailSkeleton showHeader={true} fieldCount={6} sectionCount={1} />
      </div>
    </>
  )
}

