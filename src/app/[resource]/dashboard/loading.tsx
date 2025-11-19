import { AdminHeader } from "@/components/layouts/headers"
import { DashboardWelcomeSkeleton } from "@/components/layouts/skeletons"

/**
 * Dashboard Page Loading
 * 
 * Theo Next.js 16 best practices:
 * - Loading UI hiển thị ngay khi route đang load
 * - Sử dụng skeleton phù hợp với dashboard layout
 * - Giữ header structure giống page thật
 */
export default function DashboardPageLoading() {
  return (
    <>
      <AdminHeader
        breadcrumbs={[
          { label: "Dashboard", isActive: true },
        ]}
      />
      <DashboardWelcomeSkeleton />
    </>
  )
}

