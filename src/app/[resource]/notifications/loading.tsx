import { AdminHeader } from "@/components/layouts/headers"
import { ResourceTableSkeleton } from "@/components/layouts/skeletons"

export default function NotificationsPageLoading() {
  return (
    <>
      <AdminHeader
        breadcrumbs={[
          { label: "Thông báo", isActive: true },
        ]}
      />
      <div className="flex flex-1 flex-col gap-4 p-4">
        <ResourceTableSkeleton title={false} rowCount={10} columnCount={5} />
      </div>
    </>
  )
}

