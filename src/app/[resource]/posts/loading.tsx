import { AdminHeader } from "@/components/layouts/headers"
import { ResourceTableSkeleton } from "@/components/layouts/skeletons"

export default function PostsPageLoading() {
  return (
    <>
      <AdminHeader
        breadcrumbs={[
          { label: "Bài viết", isActive: true },
        ]}
      />
      <div className="flex flex-1 flex-col gap-4 p-4">
        <ResourceTableSkeleton title={false} rowCount={10} columnCount={6} />
      </div>
    </>
  )
}

