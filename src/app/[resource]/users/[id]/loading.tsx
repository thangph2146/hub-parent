import { AdminHeader } from "@/components/layouts/headers"
import { ResourceDetailSkeleton } from "@/components/layouts/skeletons"

export default function UserDetailPageLoading() {
  return (
    <>
      <AdminHeader
        breadcrumbs={[
          { label: "Users", href: "/admin/users" },
          { label: "Chi tiết", isActive: true },
        ]}
      />
      <ResourceDetailSkeleton showHeader={false} sectionCount={2} />
    </>
  )
}

