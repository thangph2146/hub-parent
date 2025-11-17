import { AdminHeader } from "@/components/layouts/headers"
import { MessagesPageSkeleton } from "@/components/layouts/skeletons"

export default function Loading() {
  return (
    <>
      <AdminHeader
        breadcrumbs={[
          { label: "Tin nhắn", href: "/admin/messages" },
          { label: "Hộp thư đến", isActive: true },
        ]}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <MessagesPageSkeleton />
      </div>
    </>
  )
}

