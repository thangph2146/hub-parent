import type { Metadata } from "next"
import { AdminHeader } from "@/components/layouts/headers"
import { MessagesPage } from "@/features/admin/chat/components/messages-page"
import { MessagesPageSuspense } from "@/features/admin/resources/components"
import { createNestedBreadcrumbs } from "@/features/admin/resources/utils"

export const metadata: Metadata = {
  title: "Hộp thư đã xoá",
  description: "Xem và khôi phục các hội thoại đã xoá",
}

export default async function MessagesDeletedPage() {
  return (
    <>
      <AdminHeader
        breadcrumbs={createNestedBreadcrumbs({
          parentLabel: "Tin nhắn",
          parentPath: "/admin/messages",
          currentLabel: "Hộp thư đã xoá",
        })}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <MessagesPageSuspense>
          <MessagesPage initialFilterType="DELETED" contactScope="deleted" />
        </MessagesPageSuspense>
      </div>
    </>
  )
}
