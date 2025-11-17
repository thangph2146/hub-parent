import { AdminHeader } from "@/components/layouts/headers"
import { ResourceDetailSkeleton } from "@/components/layouts/skeletons"

/**
 * Dashboard Stats Page Loading
 * 
 * Theo Next.js 16 best practices:
 * - Loading UI hiển thị ngay khi route đang load
 * - Sử dụng skeleton phù hợp với stats layout
 * - Giữ header structure giống page thật
 */
export default function DashboardStatsPageLoading() {
  return (
    <>
      <AdminHeader
        breadcrumbs={[
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: "Thống kê", isActive: true },
        ]}
      />
      <div className="flex flex-1 flex-col gap-4 p-4">
        <ResourceDetailSkeleton 
          showHeader={false} 
          fieldCount={12} 
          sectionCount={3} 
        />
      </div>
    </>
  )
}

