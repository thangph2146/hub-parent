import type { Metadata } from "next"
import { AdminHeader } from "@/components/headers"
import { MessagesPage } from "@/features/admin/chat/components/messages-page"
import { TablePageSuspense } from "@/features/admin/resources/components"

/**
 * Messages Page Metadata
 * 
 * Theo Next.js 16 best practices:
 * - Metadata được merge với admin layout và root layout
 * - Title sử dụng template từ root: "Tin nhắn | CMS"
 */
export const metadata: Metadata = {
  title: "Tin nhắn",
  description: "Quản lý tin nhắn và chat",
}

/**
 * Messages Page
 * 
 * Trang quản lý tin nhắn và chat
 * - Sử dụng AdminHeader với breadcrumbs
 * - Server Component fetch data và pass xuống client component
 * - Suspense boundary cho progressive loading
 */
export default async function MessagesPageRoute() {
  return (
    <>
      <AdminHeader
        breadcrumbs={[
          { label: "Tin nhắn", isActive: true },
        ]}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TablePageSuspense columnCount={2} rowCount={10}>
          <MessagesPage />
        </TablePageSuspense>
      </div>
    </>
  )
}
