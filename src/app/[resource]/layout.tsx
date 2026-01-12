import { Suspense } from "react"
import type { Metadata } from "next"
import { getSession } from "@/auth/auth-server"
import { getMenuData } from "@/utils"
import { getOpenGraphConfig, getTwitterConfig } from "@/constants"
import { AppSidebar } from "@/components/layout/navigation"
import { NavMainWithBadges } from "@/components/layout/navigation/nav-main-with-badges"
import { NavMainSkeleton } from "@/components/skeletons"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { PermissionGate } from "@/components/access-control";
import type { Permission } from "@/permissions"
import { DEFAULT_RESOURCE_SEGMENT } from "@/permissions"
import { ResourceSegmentProvider } from "@/components/providers"
import { ScrollToTop } from "@/components/layout/scroll-to-top"

/**
 * Admin Layout Metadata
 * 
 * Theo Next.js 16 best practices:
 * - Metadata được merge với root layout
 * - Title sử dụng template từ root để có format nhất quán
 * - Metadata phù hợp với CMS/Admin panel
 * - Admin pages không nên được index bởi search engines
 */
export const metadata: Metadata = {
  title: "CMS - Hệ thống quản trị",
  description: "Hệ thống quản trị nội dung (CMS) - Quản lý người dùng, bài viết, sinh viên và các tài nguyên khác",
  keywords: ["CMS", "Content Management System", "Quản trị nội dung", "Admin Panel", "Hệ thống quản lý"],
  robots: {
    index: false, // Admin pages không nên được index
    follow: false,
  },
  openGraph: {
    ...getOpenGraphConfig(),
    title: "CMS - Hệ thống quản trị nội dung",
    description: "Hệ thống quản trị nội dung (CMS) - Quản lý người dùng, bài viết, sinh viên và các tài nguyên khác",
    siteName: "CMS - Hệ thống quản trị",
  },
  twitter: {
    ...getTwitterConfig(),
    title: "CMS - Hệ thống quản trị nội dung",
    description: "Hệ thống quản trị nội dung (CMS) - Quản lý người dùng, bài viết, sinh viên và các tài nguyên khác",
  },
}

/**
 * Admin Layout với Suspense tối ưu
 * 
 * Theo Next.js 16 best practices và NextAuth docs:
 * - Layouts KHÔNG nên làm auth checks và redirects (vì Partial Rendering)
 * - Layouts chỉ fetch user data và pass xuống children components
 * - Auth redirects được xử lý bởi Proxy (proxy.ts) sớm trong request pipeline
 * - Permission checking được xử lý bởi PermissionGate ở layout level
 * 
 * Theo Next.js 16 docs về Partial Rendering và Streaming:
 * - Layouts được render một cách độc lập, có thể cache và revalidate riêng
 * - Redirects trong layouts có thể gây ra issues với Partial Rendering
 * - Sử dụng Suspense để tách session fetching và menu generation
 * - Sidebar có thể render ngay, menu stream khi ready
 * 
 * Cấu trúc:
 * - SidebarProvider: Quản lý sidebar state
 * - AppSidebar: Sidebar navigation (nhận session data)
 * - SidebarInset: Main content area
 * - PermissionGate: Check permission dựa trên route path, hiển thị ForbiddenNotice nếu không có quyền
 */
async function NavMainWithMenu({ resourceSegment }: { resourceSegment: string }) {
  const session = await getSession()
  
  // Fetch menu data dựa trên permissions
  const menuData = session?.permissions && session.permissions.length > 0
    ? getMenuData(session.permissions as Permission[], session.roles ?? [], resourceSegment)
    : { navMain: [] }
  const navMainItems = menuData.navMain

  // Pass items to client component để inject unread counts
  return <NavMainWithBadges items={navMainItems} />
}

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ resource?: string }>
}) {
  // Session được fetch trong NavMainWithMenu để không block layout rendering
  // Layout structure render ngay, menu stream khi ready
  const resolvedParams = await params
  const resourceParam = resolvedParams?.resource?.toLowerCase()
  const resourceSegment = resourceParam && resourceParam.length > 0 ? resourceParam : DEFAULT_RESOURCE_SEGMENT

  return (
    <ResourceSegmentProvider value={resourceSegment}>
      <SidebarProvider>
        <AppSidebar
          navMainSlot={
            <Suspense fallback={<NavMainSkeleton />}>
              <NavMainWithMenu resourceSegment={resourceSegment} />
            </Suspense>
          }
        />
        <SidebarInset 
          className="flex flex-col w-full min-w-0 max-w-full"
          style={{ overflowX: 'clip' }}
          suppressHydrationWarning
        >
          <ScrollToTop />
          <PermissionGate>
            {children}
          </PermissionGate>
        </SidebarInset>
      </SidebarProvider>
    </ResourceSegmentProvider>
  )
}
