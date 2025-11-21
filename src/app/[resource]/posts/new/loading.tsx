import { AdminHeader } from "@/components/layouts/headers"
import { ResourceDetailSkeleton } from "@/components/layouts/skeletons"

export default function PostCreateLoading() {
  return (
    <>
      <AdminHeader
        breadcrumbs={[
          { label: "Bài viết", href: "/admin/posts" },
          { label: "Tạo mới", isActive: true },
        ]}
      />
      <div className="flex flex-1 flex-col gap-4 p-4">
        <ResourceDetailSkeleton showHeader={true} fieldCount={8} sectionCount={3} />
      </div>
    </>
  )
}

