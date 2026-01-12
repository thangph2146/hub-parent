import type { Metadata } from "next"
import { AdminHeader } from "@/components/layout/headers"
import { DashboardWelcome } from "@/features/admin/dashboard/dashboard-welcome"
import { createListBreadcrumbs } from "@/features/admin/resources/utils"

/**
 * Dashboard Page Metadata
 * 
 * Theo Next.js 16 best practices:
 * - Metadata được merge với admin layout và root layout
 * - Title sử dụng template từ root: "Dashboard | CMS"
 */
export const metadata: Metadata = {
  title: "Dashboard",
  description: "Trang tổng quan quản trị hệ thống",
}

export default function Page() {
  return (
    <>
      <AdminHeader breadcrumbs={createListBreadcrumbs({ listLabel: "Dashboard" })} />
      <DashboardWelcome />
    </>
  )
}
