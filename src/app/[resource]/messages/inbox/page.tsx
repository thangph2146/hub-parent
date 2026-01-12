import type { Metadata } from "next"
import { AdminHeader } from "@/components/layout/headers"
import { MessagesPage } from "@/features/admin/chat/components/messages-page"
import { MessagesPageSuspense } from "@/features/admin/resources/components"
import { createNestedBreadcrumbs } from "@/features/admin/resources/utils"

export const metadata: Metadata = {
  title: "Hộp thư đến",
  description: "Xem tất cả hội thoại đang hoạt động",
}

export default async function MessagesInboxPage() {
  return (
    <>
      <AdminHeader
        breadcrumbs={createNestedBreadcrumbs({
          parentLabel: "Tin nhắn",
          parentPath: "/admin/messages",
          currentLabel: "Hộp thư đến",
        })}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <MessagesPageSuspense>
          <MessagesPage initialFilterType="ACTIVE" contactScope="active" />
        </MessagesPageSuspense>
      </div>
    </>
  )
}
