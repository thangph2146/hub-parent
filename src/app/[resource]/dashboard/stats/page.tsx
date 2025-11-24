import type { Metadata } from "next"
import { Suspense } from "react"
import { AdminHeader } from "@/components/layouts/headers"
import { DashboardStats } from "@/features/admin/dashboard/dashboard-stats"
import { DashboardStatsSkeleton } from "@/components/layouts/skeletons"
import { createNestedBreadcrumbs } from "@/features/admin/resources/utils"

/**
 * Dashboard Stats Page Metadata
 * 
 * Theo Next.js 16 best practices:
 * - Metadata được merge với admin layout và root layout
 * - Title sử dụng template từ root: "Thống kê | CMS"
 */
export const metadata: Metadata = {
  title: "Thống kê",
  description: "Thống kê và phân tích dữ liệu hệ thống",
}

/**
 * Dashboard Stats Page với Suspense boundary
 * 
 * Theo Next.js 16 best practices:
 * - Async server components cần được wrap trong Suspense
 * - Sử dụng Suspense để stream data fetching
 * - Fallback hiển thị skeleton trong khi đang fetch data
 */
export default function Page() {
  return (
    <>
      <AdminHeader
        breadcrumbs={createNestedBreadcrumbs({
          parentLabel: "Dashboard",
          parentPath: "/admin/dashboard",
          currentLabel: "Thống kê",
        })}
      />
      <Suspense fallback={<DashboardStatsSkeleton />}>
        <DashboardStats />
      </Suspense>
    </>
  )
}

